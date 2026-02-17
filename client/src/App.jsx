import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Seismograph from './components/Seismograph';
import TranscriptPanel from './components/TranscriptPanel';
import MetricsPanel from './components/MetricsPanel';
import AlertsPanel from './components/AlertsPanel';
import FinalReport from './components/FinalReport';
import { Mic, MicOff, Activity } from 'lucide-react';

const WS_URL = 'ws://localhost:3001';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [transcripts, setTranscripts] = useState([]);
  const [metrics, setMetrics] = useState({
    seismographValue: 50,
    dominanceRatio: { speaker0: 50, speaker1: 50 },
    interruptionCount: 0,
    confidenceIndex: 0,
    fillerWordCount: 0,
    engagementScore: 50,
  });
  const [seismographHistory, setSeismographHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received:', data.type);
        
        switch (data.type) {
          case 'transcript':
            setTranscripts(prev => [...prev, {
              id: Date.now(),
              speaker: data.speaker,
              text: data.text,
              timestamp: data.timestamp,
              confidence: data.confidence
            }]);
            break;

          case 'interim':
            // Could show interim results in a different style
            break;

          case 'metrics':
            setMetrics(data);
            
            // Add to seismograph history
            setSeismographHistory(prev => {
              const newHistory = [...prev, {
                time: Date.now(),
                value: data.seismographValue
              }];
              // Keep only last 100 points
              return newHistory.slice(-100);
            });

            // Generate alerts based on metrics
            checkForAlerts(data);
            break;

          case 'final_report':
            setFinalReport(data);
            break;

          case 'status':
            console.log('Status:', data.message);
            break;

          case 'error':
            console.error('Server error:', data.message);
            addAlert('error', 'Connection Error', data.message);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Check for alerts based on metrics
  const checkForAlerts = (data) => {
    const now = Date.now();

    // Interruption alert
    if (data.interruptionCount > alerts.filter(a => a.type === 'interruption').length) {
      addAlert('interruption', 'Interruption Detected!', 
        'Someone was cut off. Let them finish their thought.');
    }

    // Dominance alert
    if (data.dominanceRatio.speaker0 > 75 || data.dominanceRatio.speaker1 > 75) {
      const lastDominanceAlert = alerts.filter(a => a.type === 'dominance').pop();
      if (!lastDominanceAlert || (now - lastDominanceAlert.timestamp) > 10000) {
        addAlert('dominance', 'Talk Time Imbalance', 
          'One speaker is dominating. Balance the conversation!');
      }
    }

    // Confidence alert
    if (data.confidenceIndex < 50) {
      const lastConfidenceAlert = alerts.filter(a => a.type === 'confidence').pop();
      if (!lastConfidenceAlert || (now - lastConfidenceAlert.timestamp) > 15000) {
        addAlert('confidence', 'Low Confidence Detected', 
          'Speech clarity is low. Speak slower and clearer.');
      }
    }

    // Seismograph critical alert
    if (data.seismographValue < 30) {
      const lastCriticalAlert = alerts.filter(a => a.type === 'critical').pop();
      if (!lastCriticalAlert || (now - lastCriticalAlert.timestamp) > 20000) {
        addAlert('critical', 'Conversation at Risk!', 
          'Multiple issues detected. Reset and refocus.');
      }
    }
  };

  const addAlert = (type, title, message) => {
    const alert = {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: Date.now()
    };
    setAlerts(prev => [...prev, alert]);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 10000);
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      // Create audio context for processing
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // Send start signal first
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'start' }));
      }

      setIsRecording(true);
      setFinalReport(null);
      setTranscripts([]);
      setSeismographHistory([]);
      setAlerts([]);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);

        // Convert Float32Array to Int16Array
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send audio to server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const base64Audio = btoa(String.fromCharCode.apply(null, new Uint8Array(pcmData.buffer)));
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            audio: base64Audio
          }));
        }
      };

    } catch (error) {
      console.error('Error starting recording:', error);
      addAlert('error', 'Microphone Error', 'Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Send stop signal
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }

    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-darker via-cyber-dark to-cyber-darker">
      {/* Header */}
      <header className="glass border-b border-cyber-blue border-opacity-30 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-cyber-blue" />
            <div>
              <h1 className="text-2xl font-bold glow-text">Negotiation Seismograph</h1>
              <p className="text-sm text-gray-400">Real-time Conversation Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-cyber-green' : 
                connectionStatus === 'error' ? 'bg-cyber-pink' : 
                'bg-gray-500'
              } animate-pulse`} />
              <span className="text-sm text-gray-400">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'error' ? 'Error' : 
                 'Disconnected'}
              </span>
            </div>

            <motion.button
              onClick={toggleRecording}
              disabled={connectionStatus !== 'connected'}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isRecording
                  ? 'bg-cyber-pink hover:bg-opacity-80 cyber-border'
                  : 'bg-cyber-blue hover:bg-opacity-80 cyber-border'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Recording
                </>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Alerts */}
        <AlertsPanel alerts={alerts} />

        {/* Seismograph - Main visualization */}
        <Seismograph 
          data={seismographHistory} 
          currentValue={metrics.seismographValue}
          isRecording={isRecording}
        />

        {/* Metrics Grid */}
        <MetricsPanel metrics={metrics} />

        {/* Transcript */}
        <TranscriptPanel transcripts={transcripts} />

        {/* Final Report */}
        <AnimatePresence>
          {finalReport && (
            <FinalReport report={finalReport} onClose={() => setFinalReport(null)} />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Built with Deepgram Audio Intelligence • DeveloperWeek 2026 Hackathon</p>
      </footer>
    </div>
  );
}

export default App;

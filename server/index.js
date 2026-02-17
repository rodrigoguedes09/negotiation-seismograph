import { createServer } from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createClient } from '@deepgram/sdk';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Metrics state per connection
const connectionMetrics = new Map();

// Initialize Deepgram client
const deepgram = createClient(DEEPGRAM_API_KEY);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('[INFO] New client connected');

  let deepgramLive = null;
  let isStreamActive = false;

  // Initialize connection metrics
  const metrics = {
    speakerStats: new Map(), // Map of speaker -> { totalTime, lastStart, wordCount, confidence }
    interruptions: [],
    startTime: Date.now(),
    lastSpeaker: null,
    lastSpeechEnd: null,
    seismographData: [],
    fillerWords: { um: 0, uh: 0, like: 0, you_know: 0 },
    conversationScore: 50
  };
  
  connectionMetrics.set(ws, metrics);

  // Handle messages from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'start') {
        console.log('[INFO] Starting audio stream...');
        isStreamActive = true;

        // Initialize Deepgram Live connection
        deepgramLive = deepgram.listen.live({
          model: 'nova-2',
          language: 'en-US',
          smart_format: true,
          diarize: true,
          interim_results: true,
          punctuate: true,
          encoding: 'linear16',
          sample_rate: 16000,
          endpointing: 300,
          utterance_end_ms: 1000
        });

        // Handle Deepgram events
        deepgramLive.on('open', () => {
          console.log('[SUCCESS] Deepgram connection opened');
          ws.send(JSON.stringify({ type: 'status', message: 'Deepgram connected' }));
        });

        deepgramLive.on('Results', (data) => {
          if (!data.channel?.alternatives?.[0]) return;

          const transcript = data.channel.alternatives[0].transcript;
          const words = data.channel.alternatives[0].words || [];
          const isFinal = data.is_final;
          const speaker = data.channel.alternatives[0].words?.[0]?.speaker;

          console.log('[Deepgram] Transcript:', transcript, '| Final:', isFinal, '| Speaker:', speaker);

          if (transcript.trim() && isFinal) {
            // Update speaker statistics
            updateSpeakerStats(metrics, speaker, words, data);

            // Detect interruptions
            detectInterruption(metrics, speaker, data.start);

            // Count filler words
            countFillerWords(metrics, transcript);

            // Calculate real-time metrics
            const calculatedMetrics = calculateMetrics(metrics);

            // Send transcript to client
            ws.send(JSON.stringify({
              type: 'transcript',
              speaker: speaker ?? 0,
              text: transcript,
              timestamp: Date.now(),
              confidence: data.channel.alternatives[0].confidence
            }));

            // Send metrics update
            ws.send(JSON.stringify({
              type: 'metrics',
              ...calculatedMetrics,
              timestamp: Date.now()
            }));
          } else if (transcript.trim() && !isFinal) {
            // Send interim results for real-time feel
            ws.send(JSON.stringify({
              type: 'interim',
              speaker: speaker ?? 0,
              text: transcript
            }));
          }
        });

        deepgramLive.on('error', (error) => {
          console.error('[ERROR] Deepgram error:', error);
          ws.send(JSON.stringify({ type: 'error', message: error.message }));
        });

        deepgramLive.on('close', () => {
          console.log('[INFO] Deepgram connection closed');
        });

      } else if (data.type === 'stop') {
        console.log('[INFO] Stopping audio stream...');
        isStreamActive = false;
        
        if (deepgramLive) {
          deepgramLive.finish();
          deepgramLive = null;
        }

        // Send final report
        const finalReport = generateFinalReport(metrics);
        ws.send(JSON.stringify({
          type: 'final_report',
          ...finalReport
        }));

      } else if (data.type === 'audio' && isStreamActive && deepgramLive) {
        // Forward audio data to Deepgram
        const audioBuffer = Buffer.from(data.audio, 'base64');
        console.log('[Audio] Received chunk:', audioBuffer.length, 'bytes');
        deepgramLive.send(audioBuffer);
      }

    } catch (error) {
      console.error('[ERROR] Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('[INFO] Client disconnected');
    if (deepgramLive) {
      deepgramLive.finish();
    }
    connectionMetrics.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('[ERROR] WebSocket error:', error);
  });
});

// Update speaker statistics
function updateSpeakerStats(metrics, speaker, words, data) {
  const speakerId = speaker ?? 0;
  
  if (!metrics.speakerStats.has(speakerId)) {
    metrics.speakerStats.set(speakerId, {
      totalTime: 0,
      wordCount: 0,
      totalConfidence: 0,
      confidenceCount: 0,
      lastStart: null
    });
  }

  const stats = metrics.speakerStats.get(speakerId);
  
  // Calculate duration from words
  if (words.length > 0) {
    const duration = words[words.length - 1].end - words[0].start;
    stats.totalTime += duration;
    stats.wordCount += words.length;
  }

  // Update confidence
  if (data.channel.alternatives[0].confidence) {
    stats.totalConfidence += data.channel.alternatives[0].confidence;
    stats.confidenceCount++;
  }

  metrics.lastSpeaker = speakerId;
  metrics.lastSpeechEnd = Date.now();
}

// Detect interruptions
function detectInterruption(metrics, speaker, startTime) {
  const speakerId = speaker ?? 0;
  
  if (metrics.lastSpeaker !== null && 
      metrics.lastSpeaker !== speakerId && 
      metrics.lastSpeechEnd && 
      (Date.now() - metrics.lastSpeechEnd) < 500) {
    
    metrics.interruptions.push({
      speaker: speakerId,
      timestamp: Date.now(),
      interruptedSpeaker: metrics.lastSpeaker
    });
  }
}

// Count filler words
function countFillerWords(metrics, transcript) {
  const text = transcript.toLowerCase();
  const patterns = {
    um: /\bum+\b/g,
    uh: /\buh+\b/g,
    like: /\blike\b/g,
    you_know: /\byou know\b/g
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    if (matches) {
      metrics.fillerWords[key] += matches.length;
    }
  }
}

// Calculate real-time metrics
function calculateMetrics(metrics) {
  const speakers = Array.from(metrics.speakerStats.entries());
  
  if (speakers.length === 0) {
    return {
      dominanceRatio: { speaker0: 50, speaker1: 50 },
      seismographValue: 50,
      interruptionCount: 0,
      confidenceIndex: 0,
      fillerWordCount: 0,
      engagementScore: 50
    };
  }

  // Calculate total time
  const totalTime = speakers.reduce((sum, [_, stats]) => sum + stats.totalTime, 0);

  // Calculate dominance ratio
  const speaker0Time = metrics.speakerStats.get(0)?.totalTime || 0;
  const speaker1Time = metrics.speakerStats.get(1)?.totalTime || 0;
  
  const dominanceRatio = {
    speaker0: totalTime > 0 ? (speaker0Time / totalTime) * 100 : 50,
    speaker1: totalTime > 0 ? (speaker1Time / totalTime) * 100 : 50
  };

  // Calculate average confidence
  let avgConfidence = 0;
  speakers.forEach(([_, stats]) => {
    if (stats.confidenceCount > 0) {
      avgConfidence += (stats.totalConfidence / stats.confidenceCount);
    }
  });
  avgConfidence = speakers.length > 0 ? (avgConfidence / speakers.length) * 100 : 0;

  // Calculate balance score (closer to 50/50 is better)
  const balanceScore = 100 - Math.abs(dominanceRatio.speaker0 - 50);

  // Count total filler words
  const totalFillers = Object.values(metrics.fillerWords).reduce((a, b) => a + b, 0);
  const fillerPenalty = Math.min(totalFillers * 2, 30);

  // Calculate seismograph value (0-100)
  // Formula: Base + balance - interruptions - fillers + confidence
  const interruptionPenalty = Math.min(metrics.interruptions.length * 10, 40);
  
  const seismographValue = Math.max(0, Math.min(100,
    50 + (balanceScore * 0.3) - interruptionPenalty - fillerPenalty + (avgConfidence * 0.2)
  ));

  // Calculate engagement score
  const engagementScore = Math.round(
    (balanceScore * 0.4) + (avgConfidence * 0.3) + 
    ((100 - interruptionPenalty) * 0.2) + ((100 - fillerPenalty) * 0.1)
  );

  return {
    dominanceRatio,
    seismographValue: Math.round(seismographValue),
    interruptionCount: metrics.interruptions.length,
    confidenceIndex: Math.round(avgConfidence),
    fillerWordCount: totalFillers,
    engagementScore: Math.max(0, Math.min(100, engagementScore)),
    speakers: speakers.map(([id, stats]) => ({
      id,
      time: stats.totalTime,
      wordCount: stats.wordCount
    }))
  };
}

// Generate final report
function generateFinalReport(metrics) {
  const finalMetrics = calculateMetrics(metrics);
  const duration = (Date.now() - metrics.startTime) / 1000;

  const insights = [];

  // Dominance insights
  if (finalMetrics.dominanceRatio.speaker0 > 70) {
    insights.push({
      type: 'warning',
      category: 'dominance',
      message: '🚨 Speaker 0 dominated the conversation (>70%). Remember: listening sells!'
    });
  } else if (finalMetrics.dominanceRatio.speaker1 > 70) {
    insights.push({
      type: 'warning',
      category: 'dominance',
      message: '🚨 Speaker 1 dominated the conversation (>70%). Great listening, but make your pitch!'
    });
  } else if (Math.abs(finalMetrics.dominanceRatio.speaker0 - 50) < 15) {
    insights.push({
      type: 'success',
      category: 'dominance',
      message: '✅ Excellent balance! Both parties engaged equally.'
    });
  }

  // Interruption insights
  if (finalMetrics.interruptionCount > 5) {
    insights.push({
      type: 'warning',
      category: 'interruptions',
      message: `🚨 ${finalMetrics.interruptionCount} interruptions detected. Slow down and let them finish.`
    });
  } else if (finalMetrics.interruptionCount === 0) {
    insights.push({
      type: 'success',
      category: 'interruptions',
      message: '✅ Zero interruptions! Respectful communication maintained.'
    });
  }

  // Confidence insights
  if (finalMetrics.confidenceIndex < 60) {
    insights.push({
      type: 'warning',
      category: 'confidence',
      message: '⚠️ Low confidence detected. Review unclear points and practice delivery.'
    });
  } else if (finalMetrics.confidenceIndex > 85) {
    insights.push({
      type: 'success',
      category: 'confidence',
      message: '✅ High confidence throughout! Clear and articulate communication.'
    });
  }

  // Filler word insights
  if (finalMetrics.fillerWordCount > 10) {
    insights.push({
      type: 'warning',
      category: 'fillers',
      message: `⚠️ ${finalMetrics.fillerWordCount} filler words detected. Practice pausing instead.`
    });
  }

  // Overall recommendation
  let recommendation = '';
  if (finalMetrics.engagementScore >= 80) {
    recommendation = '🎉 Excellent conversation! High engagement and balanced participation.';
  } else if (finalMetrics.engagementScore >= 60) {
    recommendation = '👍 Good conversation, with room for improvement in balance and clarity.';
  } else {
    recommendation = '🔧 This conversation needs work. Focus on listening more and building rapport.';
  }

  return {
    duration: Math.round(duration),
    metrics: finalMetrics,
    insights,
    recommendation,
    timestamp: new Date().toISOString()
  };
}

// Start server
server.listen(PORT, () => {
  console.log(`[SERVER] Negotiation Seismograph server running on port ${PORT}`);
  console.log(`[SERVER] WebSocket ready for connections`);
  console.log(`[SERVER] Deepgram API Key: ${DEEPGRAM_API_KEY ? 'Configured' : 'MISSING'}`);
});

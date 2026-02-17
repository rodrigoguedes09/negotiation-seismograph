import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';

export default function TranscriptPanel({ transcripts }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 cyber-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold glow-text">Live Transcript</h2>
        <div className="text-sm text-gray-400">
          {transcripts.length} messages
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="h-96 overflow-y-auto space-y-3 pr-2"
      >
        {transcripts.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p>Transcript will appear here...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {transcripts.map((transcript) => (
              <motion.div
                key={transcript.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`flex gap-3 ${
                  transcript.speaker === 0 ? 'justify-start' : 'justify-end'
                }`}
              >
                {transcript.speaker === 0 && (
                  <div className="w-8 h-8 rounded-full bg-cyber-blue bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-cyber-blue" />
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    transcript.speaker === 0
                      ? 'bg-cyber-blue bg-opacity-10 border border-cyber-blue border-opacity-30'
                      : 'bg-cyber-purple bg-opacity-10 border border-cyber-purple border-opacity-30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold" style={{
                      color: transcript.speaker === 0 ? '#00d4ff' : '#b624ff'
                    }}>
                      Speaker {transcript.speaker}
                    </span>
                    {transcript.confidence && (
                      <span className="text-xs text-gray-500">
                        {Math.round(transcript.confidence * 100)}% confident
                      </span>
                    )}
                  </div>
                  <p className="text-white">{transcript.text}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(transcript.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {transcript.speaker === 1 && (
                  <div className="w-8 h-8 rounded-full bg-cyber-purple bg-opacity-20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-cyber-purple" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

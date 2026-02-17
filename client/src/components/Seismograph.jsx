import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Seismograph({ data, currentValue, isRecording }) {
  // Transform data for recharts
  const chartData = data.map((point, index) => ({
    index,
    value: point.value,
    time: new Date(point.time).toLocaleTimeString()
  }));

  // Determine health status
  const getHealthStatus = () => {
    if (currentValue >= 70) return { color: '#00ff87', label: 'Excellent', icon: TrendingUp };
    if (currentValue >= 50) return { color: '#00d4ff', label: 'Good', icon: TrendingUp };
    if (currentValue >= 30) return { color: '#ffaa00', label: 'Warning', icon: TrendingDown };
    return { color: '#ff006e', label: 'Critical', icon: TrendingDown };
  };

  const status = getHealthStatus();
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 cyber-border"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="glow-text">Conversation Seismograph</span>
            {isRecording && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-cyber-pink"
              >
                ●
              </motion.span>
            )}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time conversation health monitoring
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Health</div>
            <div className="flex items-center gap-2">
              <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
              <span className="text-2xl font-bold" style={{ color: status.color }}>
                {currentValue}
              </span>
              <span className="text-gray-400">/100</span>
            </div>
            <div className="text-xs mt-1" style={{ color: status.color }}>
              {status.label}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 relative">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-lg">
                {isRecording ? 'Listening... speak to see the seismograph' : 'Start recording to see real-time data'}
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff87" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#00d4ff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#ff006e" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f3a" />
              <XAxis 
                dataKey="index" 
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#666"
                tick={{ fill: '#666', fontSize: 12 }}
              />
              <ReferenceLine y={70} stroke="#00ff87" strokeDasharray="3 3" label="Excellent" />
              <ReferenceLine y={50} stroke="#00d4ff" strokeDasharray="3 3" label="Good" />
              <ReferenceLine y={30} stroke="#ffaa00" strokeDasharray="3 3" label="Warning" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyber-green" />
          <span className="text-gray-400">Excellent (70+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyber-blue" />
          <span className="text-gray-400">Good (50-69)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-400">Warning (30-49)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyber-pink" />
          <span className="text-gray-400">Critical (&lt;30)</span>
        </div>
      </div>
    </motion.div>
  );
}

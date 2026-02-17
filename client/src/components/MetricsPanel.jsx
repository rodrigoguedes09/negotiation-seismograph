import { motion } from 'framer-motion';
import { Users, Zap, Target, MessageCircle, Brain, Award } from 'lucide-react';

export default function MetricsPanel({ metrics }) {
  const metricsData = [
    {
      icon: Users,
      label: 'Dominance Ratio',
      value: `${Math.round(metrics.dominanceRatio.speaker0)}% / ${Math.round(metrics.dominanceRatio.speaker1)}%`,
      detail: 'Speaker 0 / Speaker 1',
      color: 'cyber-blue',
      status: Math.abs(metrics.dominanceRatio.speaker0 - 50) < 15 ? 'good' : 'warning'
    },
    {
      icon: Zap,
      label: 'Interruptions',
      value: metrics.interruptionCount,
      detail: 'Total interruptions detected',
      color: 'cyber-pink',
      status: metrics.interruptionCount === 0 ? 'good' : metrics.interruptionCount < 3 ? 'warning' : 'critical'
    },
    {
      icon: Brain,
      label: 'Confidence Index',
      value: `${metrics.confidenceIndex}%`,
      detail: 'Speech clarity & certainty',
      color: 'cyber-purple',
      status: metrics.confidenceIndex >= 70 ? 'good' : metrics.confidenceIndex >= 50 ? 'warning' : 'critical'
    },
    {
      icon: MessageCircle,
      label: 'Filler Words',
      value: metrics.fillerWordCount,
      detail: 'Um, uh, like, you know...',
      color: 'yellow-500',
      status: metrics.fillerWordCount < 5 ? 'good' : metrics.fillerWordCount < 10 ? 'warning' : 'critical'
    },
    {
      icon: Target,
      label: 'Engagement Score',
      value: `${metrics.engagementScore}%`,
      detail: 'Overall conversation quality',
      color: 'cyber-green',
      status: metrics.engagementScore >= 70 ? 'good' : metrics.engagementScore >= 50 ? 'warning' : 'critical'
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#00ff87';
      case 'warning': return '#ffaa00';
      case 'critical': return '#ff006e';
      default: return '#00d4ff';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-xl p-4 border-l-4"
            style={{ borderColor: getStatusColor(metric.status) }}
          >
            <div className="flex items-start justify-between mb-3">
              <Icon 
                className="w-6 h-6" 
                style={{ color: getStatusColor(metric.status) }}
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor(metric.status) }}
              />
            </div>
            
            <div className="text-3xl font-bold mb-1" style={{ color: getStatusColor(metric.status) }}>
              {metric.value}
            </div>
            
            <div className="text-sm font-semibold text-white mb-1">
              {metric.label}
            </div>
            
            <div className="text-xs text-gray-400">
              {metric.detail}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

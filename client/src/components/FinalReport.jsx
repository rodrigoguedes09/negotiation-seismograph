import { motion } from 'framer-motion';
import { X, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Award } from 'lucide-react';

export default function FinalReport({ report, onClose }) {
  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff87';
    if (score >= 60) return '#00d4ff';
    if (score >= 40) return '#ffaa00';
    return '#ff006e';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const downloadReport = () => {
    const reportText = `
NEGOTIATION SEISMOGRAPH - CONVERSATION REPORT
Generated: ${new Date(report.timestamp).toLocaleString()}
Duration: ${report.duration} seconds

OVERALL SCORE: ${report.metrics.engagementScore}/100

METRICS:
- Seismograph Health: ${report.metrics.seismographValue}/100
- Speaker 0 Talk Time: ${Math.round(report.metrics.dominanceRatio.speaker0)}%
- Speaker 1 Talk Time: ${Math.round(report.metrics.dominanceRatio.speaker1)}%
- Interruptions: ${report.metrics.interruptionCount}
- Confidence Index: ${report.metrics.confidenceIndex}/100
- Filler Words: ${report.metrics.fillerWordCount}

INSIGHTS:
${report.insights.map(i => `- ${i.message}`).join('\n')}

RECOMMENDATION:
${report.recommendation}

---
Powered by Deepgram Audio Intelligence
DeveloperWeek 2026 Hackathon
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto cyber-border"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold glow-text mb-2">Conversation Report</h2>
            <p className="text-gray-400">Duration: {report.duration} seconds</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Overall Score */}
        <div className="mb-8 text-center">
          <div className="inline-block">
            <Award 
              className="w-20 h-20 mx-auto mb-4" 
              style={{ color: getScoreColor(report.metrics.engagementScore) }}
            />
            <div className="text-6xl font-bold mb-2" style={{ 
              color: getScoreColor(report.metrics.engagementScore) 
            }}>
              {report.metrics.engagementScore}
            </div>
            <div className="text-xl text-gray-400">Engagement Score</div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mb-8 p-4 rounded-xl bg-cyber-blue bg-opacity-10 border border-cyber-blue border-opacity-30">
          <h3 className="text-lg font-bold text-cyber-blue mb-2">Recommendation</h3>
          <p className="text-white">{report.recommendation}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyber-blue">
              {report.metrics.seismographValue}
            </div>
            <div className="text-sm text-gray-400 mt-1">Health Score</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyber-green">
              {Math.round(report.metrics.dominanceRatio.speaker0)}%
            </div>
            <div className="text-sm text-gray-400 mt-1">Speaker 0</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyber-purple">
              {Math.round(report.metrics.dominanceRatio.speaker1)}%
            </div>
            <div className="text-sm text-gray-400 mt-1">Speaker 1</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyber-pink">
              {report.metrics.interruptionCount}
            </div>
            <div className="text-sm text-gray-400 mt-1">Interruptions</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">
              {report.metrics.confidenceIndex}%
            </div>
            <div className="text-sm text-gray-400 mt-1">Confidence</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-500">
              {report.metrics.fillerWordCount}
            </div>
            <div className="text-sm text-gray-400 mt-1">Filler Words</div>
          </div>
        </div>

        {/* Insights */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Key Insights</h3>
          <div className="space-y-3">
            {report.insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-3 p-4 rounded-xl ${
                    insight.type === 'success' 
                      ? 'bg-cyber-green bg-opacity-10 border border-cyber-green border-opacity-30'
                      : 'bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    insight.type === 'success' ? 'text-cyber-green' : 'text-yellow-500'
                  }`} />
                  <div>
                    <div className="text-xs text-gray-400 mb-1">{insight.category.toUpperCase()}</div>
                    <p className="text-white">{insight.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={downloadReport}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyber-blue hover:bg-opacity-80 rounded-lg font-semibold transition-all cyber-border"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white bg-opacity-5 hover:bg-opacity-10 rounded-lg font-semibold transition-all border border-white border-opacity-10"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

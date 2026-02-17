import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, XCircle, AlertCircle, X } from 'lucide-react';

export default function AlertsPanel({ alerts }) {
  const getAlertStyle = (type) => {
    switch (type) {
      case 'interruption':
        return {
          icon: AlertTriangle,
          color: 'cyber-pink',
          bg: 'bg-cyber-pink bg-opacity-10',
          border: 'border-cyber-pink'
        };
      case 'dominance':
        return {
          icon: AlertCircle,
          color: 'yellow-500',
          bg: 'bg-yellow-500 bg-opacity-10',
          border: 'border-yellow-500'
        };
      case 'confidence':
        return {
          icon: Info,
          color: 'cyber-blue',
          bg: 'bg-cyber-blue bg-opacity-10',
          border: 'border-cyber-blue'
        };
      case 'critical':
        return {
          icon: XCircle,
          color: 'red-500',
          bg: 'bg-red-500 bg-opacity-10',
          border: 'border-red-500'
        };
      default:
        return {
          icon: Info,
          color: 'cyber-blue',
          bg: 'bg-cyber-blue bg-opacity-10',
          border: 'border-cyber-blue'
        };
    }
  };

  return (
    <div className="fixed top-20 right-6 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {alerts.slice(-3).map((alert) => {
          const style = getAlertStyle(alert.type);
          const Icon = style.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={`${style.bg} ${style.border} border-l-4 rounded-lg p-4 shadow-2xl backdrop-blur-lg`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-6 h-6 text-${style.color} flex-shrink-0 mt-0.5`} />
                
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">{alert.title}</h4>
                  <p className="text-sm text-gray-300">{alert.message}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

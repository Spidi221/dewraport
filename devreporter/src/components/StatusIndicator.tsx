import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SystemStatus {
  isOnline: boolean;
  lastSync: string | null;
  errorsCount: number;
}

export default function StatusIndicator() {
  const [status, setStatus] = useState<SystemStatus>({
    isOnline: true,
    lastSync: null,
    errorsCount: 0
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        setStatus(prev => ({ ...prev, isOnline: false }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!status.isOnline) return 'text-red-600';
    if (status.errorsCount > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!status.isOnline) return AlertCircle;
    if (status.errorsCount > 0) return Clock;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="flex items-center space-x-2">
      <StatusIcon className={`h-5 w-5 ${getStatusColor()}`} />
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {status.isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
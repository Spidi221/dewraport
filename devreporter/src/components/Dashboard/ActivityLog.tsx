import { CheckCircle, AlertCircle, Clock, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'sync' | 'upload' | 'error' | 'success';
  message: string;
  timestamp: string;
  details?: string;
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities');
        const data = await response.json();
        setActivities(data);
      } catch {
        // Mock data for development
        setActivities([
          {
            id: '1',
            type: 'success',
            message: 'Synchronizacja zakończona pomyślnie',
            timestamp: new Date().toISOString(),
            details: '156 mieszkań zsynchronizowanych'
          },
          {
            id: '2',
            type: 'upload',
            message: 'Wgrano nowy plik CSV',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            details: 'tambud_mieszkania_2025.csv'
          },
          {
            id: '3',
            type: 'error',
            message: 'Błąd walidacji danych',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            details: '3 mieszkania z nieprawidłowymi cenami'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      case 'upload': return Upload;
      default: return Clock;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'upload': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pl-PL');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = getActivityIcon(activity.type);
        return (
          <div key={activity.id} className="flex space-x-4">
            <div className={`p-2 rounded-full ${getActivityColor(activity.type)} bg-opacity-10`}>
              <Icon className={`h-4 w-4 ${getActivityColor(activity.type)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.message}</p>
              {activity.details && (
                <p className="text-sm text-gray-500">{activity.details}</p>
              )}
              <p className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
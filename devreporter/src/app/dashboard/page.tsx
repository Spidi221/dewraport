'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Upload, Calendar, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';
import StatusCard from '@/components/Dashboard/StatusCard';
import ActivityLog from '@/components/Dashboard/ActivityLog';

interface DashboardStatus {
  isOnline: boolean;
  apartmentsCount: number;
  lastSync: string | null;
  errorsCount: number;
  nextSync: string | null;
}

export default function Dashboard() {
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      // Mock data for development
      setStatus({
        isOnline: true,
        apartmentsCount: 156,
        lastSync: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
        errorsCount: 0,
        nextSync: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString() // 8h from now
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/sync', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        // Refresh status after sync
        setTimeout(fetchStatus, 2000);
      } else {
        alert('Błąd synchronizacji: ' + data.error);
      }
    } catch (error) {
      alert('Błąd połączenia z serwerem');
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Nigdy';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} min temu`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h temu`;
    return date.toLocaleDateString('pl-PL');
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Panel Główny</h2>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizuję...' : 'Synchronizuj Teraz'}</span>
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatusCard 
            title="Status Systemu" 
            value={status?.isOnline ? "Online" : "Offline"}
            icon={status?.isOnline ? CheckCircle : AlertCircle}
            color={status?.isOnline ? "green" : "red"}
          />
          <StatusCard 
            title="Mieszkania" 
            value={status?.apartmentsCount || 0}
            icon={Upload}
            color="blue"
          />
          <StatusCard 
            title="Ostatnia Sync" 
            value={formatLastSync(status?.lastSync || null)}
            icon={Calendar}
            color="purple"
          />
          <StatusCard 
            title="Błędy" 
            value={status?.errorsCount || 0}
            icon={AlertCircle}
            color={status?.errorsCount && status.errorsCount > 0 ? "red" : "green"}
          />
        </div>

        {/* System Status Banner */}
        {status?.isOnline && status.errorsCount === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="ml-2 text-sm text-green-800">
                System działa prawidłowo. Dane są synchronizowane automatycznie codziennie o 8:00.
              </p>
            </div>
          </div>
        )}

        {status?.errorsCount && status.errorsCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="ml-2 text-sm text-red-800">
                Wykryto {status.errorsCount} błędów. Sprawdź szczegóły w sekcji aktywności.
              </p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Ostatnia Aktywność</h3>
          <ActivityLog />
        </div>
      </div>
    </Layout>
  );
}
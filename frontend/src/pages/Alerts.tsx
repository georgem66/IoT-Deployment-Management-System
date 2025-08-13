import React, { useEffect, useState } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { alertService } from '../services/alerts';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Alert } from '../types';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const data = await alertService.getAlerts(1, 50);
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertService.acknowledgeAlert(alertId);
      await loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await alertService.resolveAlert(alertId);
      await loadAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = statusFilter === 'all' || alert.status === statusFilter;
    const severityMatch = severityFilter === 'all' || alert.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'MEDIUM':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'LOW':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'HIGH':
        return 'bg-danger-50 text-red-700 border-danger-200';
      case 'MEDIUM':
        return 'bg-warning-50 text-yellow-700 border-warning-200';
      case 'LOW':
        return 'bg-primary-50 text-blue-700 border-primary-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Security Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage security alerts from your IoT devices
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severity</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`card p-6 border-l-4 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                    <StatusBadge status={alert.status} />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-danger-100 text-danger-800' :
                      alert.severity === 'HIGH' ? 'bg-danger-50 text-red-700' :
                      alert.severity === 'MEDIUM' ? 'bg-warning-100 text-warning-800' :
                      'bg-primary-100 text-primary-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{alert.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                    {alert.device && (
                      <span>Device: {alert.device.name}</span>
                    )}
                    <span>Type: {alert.type}</span>
                  </div>
                </div>
              </div>

              {alert.status === 'ACTIVE' && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-3 py-1 text-sm bg-primary-100 hover:bg-primary-200 text-blue-700 rounded-md transition-colors"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1 text-sm bg-success-100 hover:bg-success-200 text-green-700 rounded-md transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>

            {alert.metadata && Object.keys(alert.metadata).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(alert.metadata).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-500">{key}:</span>
                      <span className="ml-1 text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12">
          <CheckCircleIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
          <p className="text-gray-500">
            {statusFilter !== 'all' || severityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Your system is running smoothly with no active alerts'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Alerts;
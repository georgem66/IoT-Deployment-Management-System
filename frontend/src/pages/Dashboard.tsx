import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { deviceService } from '../services/devices';
import { alertService } from '../services/alerts';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { DashboardStats, Device, Alert } from '../types';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [statsData, devicesData, alertsData] = await Promise.all([
          deviceService.getDashboardStats(),
          deviceService.getDevices(),
          alertService.getAlerts(1, 5)
        ]);

        setStats(statsData);
        setDevices(devicesData);
        setAlerts(alertsData.alerts);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const deviceStatusData = {
    labels: ['Online', 'Offline', 'Warning'],
    datasets: [
      {
        data: [
          stats.onlineDevices,
          stats.offlineDevices,
          devices.filter(d => d.status === 'WARNING').length
        ],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };

  const securityScoreData = {
    labels: devices.slice(0, 10).map(d => d.name),
    datasets: [
      {
        label: 'Security Score',
        data: devices.slice(0, 10).map(d => d.securityScore),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Devices"
          value={stats.totalDevices}
          icon={ComputerDesktopIcon}
          color="primary"
        />
        <StatsCard
          title="Online Devices"
          value={stats.onlineDevices}
          icon={ShieldCheckIcon}
          color="success"
        />
        <StatsCard
          title="Critical Alerts"
          value={stats.criticalAlerts}
          icon={ExclamationTriangleIcon}
          color="danger"
        />
        <StatsCard
          title="Avg Security Score"
          value={`${Math.round(stats.averageSecurityScore)}%`}
          icon={ChartBarIcon}
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Status Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={deviceStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Security Score Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Scores</h3>
          <div className="h-64">
            <Line
              data={securityScoreData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Devices and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Devices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Devices</h3>
            <Link
              to="/devices"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {devices.slice(0, 5).map((device) => (
              <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{device.name}</h4>
                  <p className="text-xs text-gray-500">{device.ipAddress}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={device.status} />
                  <span className="text-sm text-gray-500">{device.securityScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <Link
              to="/alerts"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{alert.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={alert.severity as any} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: 'primary' | 'success' | 'danger' | 'warning';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500'
  };

  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} p-3 rounded-full`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { deviceService } from '../services/devices';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Device } from '../types';
import DeviceModal from '../components/DeviceModal';

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    filterDevices();
  }, [devices, searchTerm, statusFilter]);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const data = await deviceService.getDevices();
      setDevices(data);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDevices = () => {
    let filtered = devices;

    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ipAddress.includes(searchTerm) ||
        device.deviceType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }

    setFilteredDevices(filtered);
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    setIsModalOpen(true);
  };

  const handleNewDevice = () => {
    setSelectedDevice(null);
    setIsModalOpen(true);
  };

  const handleDeviceSave = async (deviceData: Partial<Device>) => {
    try {
      if (selectedDevice) {
        await deviceService.updateDevice(selectedDevice.id, deviceData);
      } else {
        await deviceService.createDevice(deviceData);
      }
      await loadDevices();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving device:', error);
    }
  };

  const handleDeviceDelete = async (deviceId: string) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await deviceService.deleteDevice(deviceId);
        await loadDevices();
      } catch (error) {
        console.error('Error deleting device:', error);
      }
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
          <h1 className="text-2xl font-semibold text-gray-900">Devices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your IoT devices and monitor their status
          </p>
        </div>
        <button
          onClick={handleNewDevice}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Device
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onSelect={handleDeviceSelect}
            onDelete={handleDeviceDelete}
          />
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ComputerDesktopIcon className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first IoT device'}
          </p>
        </div>
      )}

      {/* Device Modal */}
      <DeviceModal
        isOpen={isModalOpen}
        device={selectedDevice}
        onClose={() => setIsModalOpen(false)}
        onSave={handleDeviceSave}
      />
    </div>
  );
};

interface DeviceCardProps {
  device: Device;
  onSelect: (device: Device) => void;
  onDelete: (deviceId: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onSelect, onDelete }) => {
  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1" onClick={() => onSelect(device)}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{device.name}</h3>
          <p className="text-sm text-gray-500">{device.deviceType}</p>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={device.status} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(device.id);
            }}
            className="text-gray-400 hover:text-red-600 text-sm"
          >
            ×
          </button>
        </div>
      </div>

      <div onClick={() => onSelect(device)}>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IP Address:</span>
            <span className="font-mono text-gray-900">{device.ipAddress}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Location:</span>
            <span className="text-gray-900">{device.location || 'Not set'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Security Score:</span>
            <span className={`font-semibold ${getSecurityScoreColor(device.securityScore)}`}>
              {device.securityScore}%
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          Last seen: {new Date(device.lastSeen).toLocaleString()}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
        <Link
          to={`/devices/${device.id}/telemetry`}
          className="flex-1 text-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors"
        >
          Telemetry
        </Link>
        <Link
          to={`/devices/${device.id}/scans`}
          className="flex-1 text-center py-2 px-3 bg-primary-100 hover:bg-primary-200 text-blue-700 text-sm rounded-md transition-colors"
        >
          Scans
        </Link>
      </div>
    </div>
  );
};

export default DevicesPage;
import React from 'react';

interface StatusBadgeProps {
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'CRITICAL' | 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'ONLINE':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'OFFLINE':
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800';
      case 'ACKNOWLEDGED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center ${sizeClass} font-medium rounded-full ${getStatusStyles(status)}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  deviceType: string;
  location?: string;
  description?: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'CRITICAL';
  lastSeen: string;
  securityScore: number;
  osInfo?: string;
  firmwareVersion?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryData {
  id: string;
  deviceId: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  temperature?: number;
  batteryLevel?: number;
  uptime: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'SECURITY' | 'PERFORMANCE' | 'SYSTEM' | 'ANOMALY';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  deviceId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  resolvedAt?: string;
  device?: Device;
}

export interface VulnerabilityScan {
  id: string;
  deviceId: string;
  scanType: 'PORT_SCAN' | 'VULNERABILITY_SCAN' | 'NETWORK_SCAN' | 'COMPLIANCE_SCAN';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  results?: {
    vulnerabilities: VulnerabilityResult[];
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  startedAt: string;
  completedAt?: string;
  device?: Device;
}

export interface VulnerabilityResult {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  solution?: string;
  references?: string[];
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  criticalAlerts: number;
  averageSecurityScore: number;
  totalScans: number;
  totalVulnerabilities: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
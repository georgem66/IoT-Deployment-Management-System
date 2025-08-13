import api from './api';
import { Device, TelemetryData, DashboardStats } from '../types';

export const deviceService = {
  async getDevices(): Promise<Device[]> {
    const response = await api.get('/api/devices');
    return response.data;
  },

  async getDevice(id: string): Promise<Device> {
    const response = await api.get(`/api/devices/${id}`);
    return response.data;
  },

  async createDevice(device: Partial<Device>): Promise<Device> {
    const response = await api.post('/api/devices', device);
    return response.data;
  },

  async updateDevice(id: string, device: Partial<Device>): Promise<Device> {
    const response = await api.patch(`/api/devices/${id}`, device);
    return response.data;
  },

  async deleteDevice(id: string): Promise<void> {
    await api.delete(`/api/devices/${id}`);
  },

  async getDeviceTelemetry(deviceId: string, limit = 100): Promise<TelemetryData[]> {
    const response = await api.get(`/api/devices/${deviceId}/telemetry?limit=${limit}`);
    return response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/api/devices/stats');
    return response.data;
  },

  async heartbeat(deviceId: string): Promise<void> {
    await api.post(`/api/devices/${deviceId}/heartbeat`);
  }
};
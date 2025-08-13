import api from './api';
import { Alert } from '../types';

export const alertService = {
  async getAlerts(page = 1, limit = 20): Promise<{ alerts: Alert[]; total: number }> {
    const response = await api.get(`/api/alerts?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getAlert(id: string): Promise<Alert> {
    const response = await api.get(`/api/alerts/${id}`);
    return response.data;
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    const response = await api.patch(`/api/alerts/${id}/acknowledge`);
    return response.data;
  },

  async resolveAlert(id: string): Promise<Alert> {
    const response = await api.patch(`/api/alerts/${id}/resolve`);
    return response.data;
  },

  async getAlertStats(): Promise<{
    total: number;
    active: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    const response = await api.get('/api/alerts/stats');
    return response.data;
  }
};
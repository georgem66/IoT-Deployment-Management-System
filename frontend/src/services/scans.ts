import api from './api';
import { VulnerabilityScan } from '../types';

export const scanService = {
  async getScans(deviceId?: string): Promise<VulnerabilityScan[]> {
    const params = deviceId ? `?deviceId=${deviceId}` : '';
    const response = await api.get(`/api/vulnerability/scans${params}`);
    return response.data;
  },

  async getScan(id: string): Promise<VulnerabilityScan> {
    const response = await api.get(`/api/vulnerability/scans/${id}`);
    return response.data;
  },

  async startScan(deviceId: string, scanType: string): Promise<VulnerabilityScan> {
    const response = await api.post('/api/vulnerability/scan', {
      deviceId,
      scanType
    });
    return response.data;
  },

  async getScanResults(scanId: string): Promise<any> {
    const response = await api.get(`/api/vulnerability/scans/${scanId}/results`);
    return response.data;
  }
};
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AlertsService } from '../alerts/alerts.service';
import { DeviceTelemetry, Device } from '@prisma/client';

export interface AnomalyRule {
  id: string;
  name: string;
  description: string;
  condition: (data: DeviceTelemetry[], device: Device) => boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: (data: DeviceTelemetry[], device: Device) => string;
}

export interface AnomalyDetectionResult {
  deviceId: string;
  deviceName: string;
  anomalyType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  evidence: any;
  timestamp: Date;
}

@Injectable()
export class AnomalyDetectionService {
  private readonly logger = new Logger(AnomalyDetectionService.name);
  private anomalyRules: AnomalyRule[] = [];

  constructor(
    private readonly database: DatabaseService,
    private readonly alertsService: AlertsService,
  ) {
    this.initializeRules();
  }

  private initializeRules() {
    this.anomalyRules = [
      {
        id: 'high-cpu-sustained',
        name: 'Sustained High CPU Usage',
        description: 'CPU usage above 90% for extended period',
        condition: (data: DeviceTelemetry[]) => {
          if (data.length < 5) return false;
          const recent = data.slice(0, 5);
          return recent.every(d => (d.cpuUsage || 0) > 90);
        },
        severity: 'HIGH',
        message: (data: DeviceTelemetry[], device: Device) => 
          `Device "${device.name}" has sustained high CPU usage (avg: ${Math.round(data.slice(0, 5).reduce((sum, d) => sum + (d.cpuUsage || 0), 0) / 5)}%)`
      },

      {
        id: 'memory-spike',
        name: 'Memory Usage Spike',
        description: 'Sudden increase in memory usage',
        condition: (data: DeviceTelemetry[]) => {
          if (data.length < 10) return false;
          const current = data[0].memoryUsage || 0;
          const baseline = data.slice(1, 10).reduce((sum, d) => sum + (d.memoryUsage || 0), 0) / 9;
          return current > baseline + 30 && current > 85;
        },
        severity: 'MEDIUM',
        message: (data: DeviceTelemetry[], device: Device) => 
          `Memory usage spike detected on device "${device.name}" (${Math.round(data[0].memoryUsage || 0)}%)`
      },

      {
        id: 'unusual-network-traffic',
        name: 'Unusual Network Traffic',
        description: 'Network traffic significantly above normal patterns',
        condition: (data: DeviceTelemetry[]) => {
          if (data.length < 20) return false;
          const current = (data[0].networkIn || 0) + (data[0].networkOut || 0);
          const historical = data.slice(1, 20);
          const avgTraffic = historical.reduce((sum, d) => sum + (d.networkIn || 0) + (d.networkOut || 0), 0) / historical.length;
          const threshold = avgTraffic * 3;
          return current > threshold && current > 1000;
        },
        severity: 'MEDIUM',
        message: (data: DeviceTelemetry[], device: Device) => 
          `Unusual network traffic detected on device "${device.name}" (${Math.round((data[0].networkIn || 0) + (data[0].networkOut || 0))} bytes)`
      },

      {
        id: 'high-temperature',
        name: 'High Operating Temperature',
        description: 'Device operating temperature above safe limits',
        condition: (data: DeviceTelemetry[]) => {
          if (data.length < 3) return false;
          const recent = data.slice(0, 3);
          return recent.every(d => (d.temperature || 0) > 80);
        },
        severity: 'CRITICAL',
        message: (data: DeviceTelemetry[], device: Device) => 
          `Critical temperature detected on device "${device.name}" (${Math.round(data[0].temperature || 0)}°C)`
      },

      {
        id: 'disk-space-critical',
        name: 'Critical Disk Space',
        description: 'Disk usage approaching capacity',
        condition: (data: DeviceTelemetry[]) => {
          return (data[0]?.diskUsage || 0) > 95;
        },
        severity: 'HIGH',
        message: (data: DeviceTelemetry[], device: Device) => 
          `Critical disk space on device "${device.name}" (${Math.round(data[0].diskUsage || 0)}% used)`
      },

      {
        id: 'intermittent-connectivity',
        name: 'Intermittent Connectivity',
        description: 'Device showing signs of unstable connection',
        condition: (data: DeviceTelemetry[], device: Device) => {
          if (data.length < 10) return false;
          
          const timestamps = data.map(d => d.timestamp.getTime()).sort((a, b) => b - a);
          let gapCount = 0;
          
          for (let i = 0; i < timestamps.length - 1; i++) {
            const gap = timestamps[i] - timestamps[i + 1];
            const expectedInterval = 60000;
            if (gap > expectedInterval * 3) {
              gapCount++;
            }
          }
          
          return gapCount >= 3;
        },
        severity: 'MEDIUM',
        message: (data: DeviceTelemetry[], device: Device) => 
          `Intermittent connectivity detected for device "${device.name}"`
      }
    ];
  }

  async analyzeDevice(deviceId: string): Promise<AnomalyDetectionResult[]> {
    const device = await this.database.device.findUnique({
      where: { id: deviceId }
    });

    if (!device) {
      throw new Error('Device not found');
    }

    const telemetryData = await this.database.deviceTelemetry.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    if (telemetryData.length === 0) {
      this.logger.warn(`No telemetry data found for device ${device.name}`);
      return [];
    }

    const anomalies: AnomalyDetectionResult[] = [];

    for (const rule of this.anomalyRules) {
      try {
        if (rule.condition(telemetryData, device)) {
          const anomaly: AnomalyDetectionResult = {
            deviceId,
            deviceName: device.name,
            anomalyType: rule.name,
            severity: rule.severity,
            description: rule.message(telemetryData, device),
            evidence: {
              ruleId: rule.id,
              dataPoints: telemetryData.slice(0, 5).map(d => ({
                timestamp: d.timestamp,
                cpuUsage: d.cpuUsage,
                memoryUsage: d.memoryUsage,
                temperature: d.temperature,
                networkIn: d.networkIn,
                networkOut: d.networkOut,
                diskUsage: d.diskUsage,
              }))
            },
            timestamp: new Date()
          };

          anomalies.push(anomaly);

          await this.alertsService.createAnomalyAlert(
            deviceId,
            device.name,
            rule.name,
            anomaly.evidence
          );

          this.logger.warn(`Anomaly detected: ${rule.name} on device ${device.name}`);
        }
      } catch (error) {
        this.logger.error(`Error applying anomaly rule ${rule.id}:`, error);
      }
    }

    return anomalies;
  }

  async analyzeAllDevices(): Promise<AnomalyDetectionResult[]> {
    const devices = await this.database.device.findMany({
      where: { status: 'ONLINE' },
      select: { id: true }
    });

    const allAnomalies: AnomalyDetectionResult[] = [];

    for (const device of devices) {
      try {
        const deviceAnomalies = await this.analyzeDevice(device.id);
        allAnomalies.push(...deviceAnomalies);
      } catch (error) {
        this.logger.error(`Error analyzing device ${device.id}:`, error);
      }
    }

    this.logger.log(`Analyzed ${devices.length} devices, found ${allAnomalies.length} anomalies`);
    return allAnomalies;
  }

  async getAnomalyHistory(deviceId: string, days = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const anomalyAlerts = await this.database.alert.findMany({
      where: {
        deviceId,
        type: 'ANOMALY_DETECTED',
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    return anomalyAlerts.map(alert => ({
      id: alert.id,
      type: (alert.metadata as any)?.anomalyType || 'Unknown',
      severity: alert.severity,
      description: alert.description,
      timestamp: alert.createdAt,
      status: alert.status,
      evidence: (alert.metadata as any)?.details
    }));
  }

  async getAnomalyStatistics(userId: string, userRole: string): Promise<any> {
    const deviceFilter = userRole === 'ADMIN' 
      ? {} 
      : { device: { ownerId: userId } };

    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const [
      totalAnomalies,
      recent24h,
      recentWeek,
      byType,
      bySeverity
    ] = await Promise.all([
      this.database.alert.count({
        where: { 
          type: 'ANOMALY_DETECTED',
          ...deviceFilter 
        }
      }),
      this.database.alert.count({
        where: { 
          type: 'ANOMALY_DETECTED',
          createdAt: { gte: last24Hours },
          ...deviceFilter 
        }
      }),
      this.database.alert.count({
        where: { 
          type: 'ANOMALY_DETECTED',
          createdAt: { gte: lastWeek },
          ...deviceFilter 
        }
      }),
      this.database.alert.groupBy({
        by: ['metadata'],
        where: { 
          type: 'ANOMALY_DETECTED',
          ...deviceFilter 
        },
        _count: { id: true }
      }),
      this.database.alert.groupBy({
        by: ['severity'],
        where: { 
          type: 'ANOMALY_DETECTED',
          ...deviceFilter 
        },
        _count: { severity: true }
      })
    ]);

    return {
      totalAnomalies,
      recent24h,
      recentWeek,
      severityBreakdown: bySeverity.reduce((acc, item) => {
        acc[item.severity] = item._count.severity;
        return acc;
      }, {}),
      rules: this.anomalyRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        severity: rule.severity
      }))
    };
  }

  async createCustomRule(ruleData: {
    name: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    condition: string;
  }): Promise<AnomalyRule> {
    const rule: AnomalyRule = {
      id: `custom-${Date.now()}`,
      name: ruleData.name,
      description: ruleData.description,
      severity: ruleData.severity,
      condition: new Function('data', 'device', ruleData.condition) as any,
      message: () => `Custom rule "${ruleData.name}" triggered`
    };

    this.anomalyRules.push(rule);
    return rule;
  }
}

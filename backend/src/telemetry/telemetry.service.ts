import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma, DeviceTelemetry } from '@prisma/client';

export interface TelemetryQuery {
  deviceId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  metrics?: string[];
}

export interface TelemetryStats {
  metric: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

@Injectable()
export class TelemetryService {
  constructor(private readonly database: DatabaseService) {}

  async getTelemetryData(query: TelemetryQuery, userId: string, userRole: string): Promise<DeviceTelemetry[]> {
    const deviceWhere: Prisma.DeviceWhereInput = { id: query.deviceId };
    if (userRole !== 'ADMIN') {
      deviceWhere.ownerId = userId;
    }

    const device = await this.database.device.findFirst({
      where: deviceWhere
    });

    if (!device) {
      throw new NotFoundException('Device not found or access denied');
    }

    const where: Prisma.DeviceTelemetryWhereInput = { deviceId: query.deviceId };
    
    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }

    return this.database.deviceTelemetry.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: query.limit || 100,
    });
  }

  async getTelemetryStats(
    deviceId: string, 
    startDate?: Date, 
    endDate?: Date,
    userId?: string,
    userRole?: string
  ): Promise<TelemetryStats[]> {
    if (userId) {
      const deviceWhere: Prisma.DeviceWhereInput = { id: deviceId };
      if (userRole !== 'ADMIN') {
        deviceWhere.ownerId = userId;
      }

      const device = await this.database.device.findFirst({
        where: deviceWhere
      });

      if (!device) {
        throw new NotFoundException('Device not found or access denied');
      }
    }

    const where: Prisma.DeviceTelemetryWhereInput = { deviceId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const stats = await this.database.deviceTelemetry.aggregate({
      where,
      _avg: {
        cpuUsage: true,
        memoryUsage: true,
        diskUsage: true,
        temperature: true,
        networkIn: true,
        networkOut: true,
      },
      _min: {
        cpuUsage: true,
        memoryUsage: true,
        diskUsage: true,
        temperature: true,
        networkIn: true,
        networkOut: true,
      },
      _max: {
        cpuUsage: true,
        memoryUsage: true,
        diskUsage: true,
        temperature: true,
        networkIn: true,
        networkOut: true,
      },
      _count: {
        id: true,
      }
    });

    const result: TelemetryStats[] = [];
    const metrics = ['cpuUsage', 'memoryUsage', 'diskUsage', 'temperature', 'networkIn', 'networkOut'];

    metrics.forEach(metric => {
      if (stats._avg[metric] !== null) {
        result.push({
          metric,
          avg: stats._avg[metric] || 0,
          min: stats._min[metric] || 0,
          max: stats._max[metric] || 0,
          count: stats._count.id,
        });
      }
    });

    return result;
  }

  async getRecentTelemetry(deviceId: string, limit = 20, userId?: string, userRole?: string): Promise<DeviceTelemetry[]> {
    if (userId) {
      const deviceWhere: Prisma.DeviceWhereInput = { id: deviceId };
      if (userRole !== 'ADMIN') {
        deviceWhere.ownerId = userId;
      }

      const device = await this.database.device.findFirst({
        where: deviceWhere
      });

      if (!device) {
        throw new NotFoundException('Device not found or access denied');
      }
    }

    return this.database.deviceTelemetry.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async createTelemetryRecord(data: Omit<DeviceTelemetry, 'id' | 'timestamp'>): Promise<DeviceTelemetry> {
    return this.database.deviceTelemetry.create({
      data: {
        ...data,
        timestamp: new Date(),
      }
    });
  }

  async cleanOldTelemetryData(daysToKeep = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.database.deviceTelemetry.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }

  async getDeviceHealthScore(deviceId: string): Promise<{ score: number; factors: any }> {
    const recentData = await this.getRecentTelemetry(deviceId, 10);
    
    if (recentData.length === 0) {
      return { score: 0, factors: { message: 'No telemetry data available' } };
    }

    let score = 100;
    const factors = {
      cpu: { score: 100, status: 'good' },
      memory: { score: 100, status: 'good' },
      disk: { score: 100, status: 'good' },
      temperature: { score: 100, status: 'good' },
      connectivity: { score: 100, status: 'good' }
    };

    const avgCpu = recentData.reduce((sum, d) => sum + (d.cpuUsage || 0), 0) / recentData.length;
    const avgMemory = recentData.reduce((sum, d) => sum + (d.memoryUsage || 0), 0) / recentData.length;
    const avgDisk = recentData.reduce((sum, d) => sum + (d.diskUsage || 0), 0) / recentData.length;
    const avgTemp = recentData.reduce((sum, d) => sum + (d.temperature || 0), 0) / recentData.length;

    if (avgCpu > 90) {
      factors.cpu = { score: 20, status: 'critical' };
      score -= 30;
    } else if (avgCpu > 75) {
      factors.cpu = { score: 60, status: 'warning' };
      score -= 15;
    } else if (avgCpu > 50) {
      factors.cpu = { score: 80, status: 'moderate' };
      score -= 5;
    }

    if (avgMemory > 95) {
      factors.memory = { score: 10, status: 'critical' };
      score -= 25;
    } else if (avgMemory > 85) {
      factors.memory = { score: 50, status: 'warning' };
      score -= 10;
    } else if (avgMemory > 70) {
      factors.memory = { score: 75, status: 'moderate' };
      score -= 5;
    }

    if (avgDisk > 95) {
      factors.disk = { score: 15, status: 'critical' };
      score -= 20;
    } else if (avgDisk > 85) {
      factors.disk = { score: 60, status: 'warning' };
      score -= 10;
    }

    if (avgTemp > 80) {
      factors.temperature = { score: 20, status: 'critical' };
      score -= 25;
    } else if (avgTemp > 70) {
      factors.temperature = { score: 60, status: 'warning' };
      score -= 10;
    }

    const latestData = recentData[0];
    const timeSinceLastData = Date.now() - latestData.timestamp.getTime();
    const minutesSinceLastData = timeSinceLastData / (1000 * 60);

    if (minutesSinceLastData > 60) {
      factors.connectivity = { score: 10, status: 'critical' };
      score -= 30;
    } else if (minutesSinceLastData > 30) {
      factors.connectivity = { score: 50, status: 'warning' };
      score -= 15;
    } else if (minutesSinceLastData > 10) {
      factors.connectivity = { score: 75, status: 'moderate' };
      score -= 5;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors
    };
  }
}

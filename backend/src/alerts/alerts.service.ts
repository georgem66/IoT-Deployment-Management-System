import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Alert, AlertStatus, AlertType, AlertSeverity, Prisma } from '@prisma/client';
import { CreateAlertDto, UpdateAlertDto, AlertQueryDto } from './dto/alerts.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly database: DatabaseService) {}

  async create(createAlertDto: CreateAlertDto, userId?: string): Promise<Alert> {
    const data: any = {
      ...createAlertDto,
      status: AlertStatus.ACTIVE,
    };

    if (userId) {
      data.userId = userId;
    }

    return this.database.alert.create({
      data,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            type: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
  }

  async findAll(query: AlertQueryDto, userId: string, userRole: string): Promise<Alert[]> {
    const where: Prisma.AlertWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.severity) where.severity = query.severity;
    if (query.deviceId) where.deviceId = query.deviceId;

    if (userRole !== 'ADMIN') {
      where.OR = [
        { userId },
        { 
          device: { ownerId: userId }
        }
      ];
    }

    const limit = query.limit ? parseInt(query.limit, 10) : 50;

    return this.database.alert.findMany({
      where,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            type: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
    });
  }

  async findOne(id: string, userId: string, userRole: string): Promise<Alert> {
    const where: Prisma.AlertWhereInput = { id };

    if (userRole !== 'ADMIN') {
      where.OR = [
        { userId },
        { 
          device: { ownerId: userId }
        }
      ];
    }

    const alert = await this.database.alert.findFirst({
      where,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            type: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!alert) {
      throw new NotFoundException('Alert not found or access denied');
    }

    return alert;
  }

  async update(id: string, updateAlertDto: UpdateAlertDto, userId: string, userRole: string): Promise<Alert> {
    await this.findOne(id, userId, userRole);

    const updateData: any = { ...updateAlertDto };

    if (updateAlertDto.status === AlertStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    return this.database.alert.update({
      where: { id },
      data: updateData,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
            type: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    await this.findOne(id, userId, userRole);

    await this.database.alert.delete({
      where: { id }
    });
  }

  async getAlertStatistics(userId: string, userRole: string): Promise<any> {
    const where: Prisma.AlertWhereInput = {};

    if (userRole !== 'ADMIN') {
      where.OR = [
        { userId },
        { device: { ownerId: userId } }
      ];
    }

    const [
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      alertsByType,
      recentAlerts
    ] = await Promise.all([
      this.database.alert.count({ where }),
      this.database.alert.count({ 
        where: { ...where, status: AlertStatus.ACTIVE }
      }),
      this.database.alert.count({ 
        where: { ...where, status: AlertStatus.RESOLVED }
      }),
      this.database.alert.count({ 
        where: { ...where, severity: AlertSeverity.CRITICAL }
      }),
      this.database.alert.count({ 
        where: { ...where, severity: AlertSeverity.HIGH }
      }),
      this.database.alert.count({ 
        where: { ...where, severity: AlertSeverity.MEDIUM }
      }),
      this.database.alert.count({ 
        where: { ...where, severity: AlertSeverity.LOW }
      }),
      this.database.alert.groupBy({
        by: ['type'],
        where,
        _count: { type: true }
      }),
      this.database.alert.findMany({
        where: { ...where, status: AlertStatus.ACTIVE },
        take: 10,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          device: {
            select: {
              id: true,
              name: true,
              type: true,
            }
          }
        }
      })
    ]);

    return {
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      severityBreakdown: {
        critical: criticalAlerts,
        high: highAlerts,
        medium: mediumAlerts,
        low: lowAlerts,
      },
      typeBreakdown: alertsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
      recentAlerts,
    };
  }

  async createSystemAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    description: string,
    deviceId?: string,
    metadata?: any
  ): Promise<Alert> {
    return this.create({
      type,
      severity,
      title,
      description,
      deviceId,
      metadata,
    });
  }

  async createDeviceOfflineAlert(deviceId: string, deviceName: string): Promise<Alert> {
    return this.createSystemAlert(
      AlertType.DEVICE_OFFLINE,
      AlertSeverity.MEDIUM,
      'Device Offline',
      `Device "${deviceName}" has gone offline and is no longer responding`,
      deviceId,
      { lastSeen: new Date().toISOString() }
    );
  }

  async createHighCpuAlert(deviceId: string, deviceName: string, cpuUsage: number): Promise<Alert> {
    return this.createSystemAlert(
      AlertType.HIGH_CPU_USAGE,
      cpuUsage > 95 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
      'High CPU Usage Detected',
      `Device "${deviceName}" is experiencing high CPU usage (${cpuUsage}%)`,
      deviceId,
      { cpuUsage, threshold: 90 }
    );
  }

  async createHighMemoryAlert(deviceId: string, deviceName: string, memoryUsage: number): Promise<Alert> {
    return this.createSystemAlert(
      AlertType.HIGH_MEMORY_USAGE,
      memoryUsage > 95 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH,
      'High Memory Usage Detected',
      `Device "${deviceName}" is experiencing high memory usage (${memoryUsage}%)`,
      deviceId,
      { memoryUsage, threshold: 85 }
    );
  }

  async createVulnerabilityAlert(deviceId: string, deviceName: string, vulnerabilityCount: number, severity: string): Promise<Alert> {
    return this.createSystemAlert(
      AlertType.VULNERABILITY_FOUND,
      severity === 'CRITICAL' ? AlertSeverity.CRITICAL : 
      severity === 'HIGH' ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
      'Security Vulnerabilities Found',
      `${vulnerabilityCount} ${severity.toLowerCase()} severity vulnerabilities found on device "${deviceName}"`,
      deviceId,
      { vulnerabilityCount, vulnerabilitySeverity: severity }
    );
  }

  async createAnomalyAlert(deviceId: string, deviceName: string, anomalyType: string, details: any): Promise<Alert> {
    return this.createSystemAlert(
      AlertType.ANOMALY_DETECTED,
      AlertSeverity.MEDIUM,
      'Anomalous Behavior Detected',
      `Unusual ${anomalyType} detected on device "${deviceName}"`,
      deviceId,
      { anomalyType, details }
    );
  }

  async markAlertsAsResolved(deviceId: string, alertTypes: AlertType[]): Promise<void> {
    await this.database.alert.updateMany({
      where: {
        deviceId,
        type: { in: alertTypes },
        status: AlertStatus.ACTIVE
      },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedAt: new Date()
      }
    });
  }
}

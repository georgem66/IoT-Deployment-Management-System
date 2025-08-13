import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException 
} from '@nestjs/common';
import { Device, DeviceStatus, DeviceType, RiskLevel, Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceQueryDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly database: DatabaseService) {}

  async create(createDeviceDto: CreateDeviceDto, ownerId: string): Promise<Device> {
    const existingDevice = await this.database.device.findUnique({
      where: { macAddress: createDeviceDto.macAddress }
    });

    if (existingDevice) {
      throw new ConflictException('Device with this MAC address already exists');
    }

    return this.database.device.create({
      data: {
        ...createDeviceDto,
        ownerId,
        status: DeviceStatus.OFFLINE,
        riskLevel: RiskLevel.UNKNOWN,
      },
      include: {
        owner: {
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

  async findAll(query: DeviceQueryDto, userId: string, userRole: string): Promise<Device[]> {
    const where: Prisma.DeviceWhereInput = {};

    if (userRole !== 'ADMIN') {
      where.ownerId = userId;
    }

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { manufacturer: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
        { ipAddress: { contains: query.search } },
      ];
    }

    return this.database.device.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            alerts: { where: { status: 'ACTIVE' } },
            scans: true,
          }
        }
      },
      orderBy: [
        { lastSeen: 'desc' },
        { registeredAt: 'desc' }
      ]
    });
  }

  async findOne(id: string, userId: string, userRole: string): Promise<Device> {
    const where: Prisma.DeviceWhereInput = { id };
    
    if (userRole !== 'ADMIN') {
      where.ownerId = userId;
    }

    const device = await this.database.device.findFirst({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        telemetry: {
          take: 20,
          orderBy: { timestamp: 'desc' }
        },
        scans: {
          take: 5,
          orderBy: { startedAt: 'desc' }
        },
        alerts: {
          take: 10,
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            alerts: { where: { status: 'ACTIVE' } },
            scans: true,
            telemetry: true,
          }
        }
      }
    });

    if (!device) {
      throw new NotFoundException('Device not found or access denied');
    }

    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto, userId: string, userRole: string): Promise<Device> {
    await this.findOne(id, userId, userRole);

    return this.database.device.update({
      where: { id },
      data: updateDeviceDto,
      include: {
        owner: {
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

    await this.database.device.delete({
      where: { id }
    });
  }

  async updateHeartbeat(deviceId: string, telemetryData: any): Promise<void> {
    await this.database.device.update({
      where: { id: deviceId },
      data: {
        status: DeviceStatus.ONLINE,
        lastSeen: new Date(),
      }
    });

    await this.database.deviceTelemetry.create({
      data: {
        deviceId,
        ...telemetryData
      }
    });
  }

  async getDeviceStatistics(userId: string, userRole: string): Promise<any> {
    const where: Prisma.DeviceWhereInput = {};
    
    if (userRole !== 'ADMIN') {
      where.ownerId = userId;
    }

    const [
      totalDevices,
      onlineDevices,
      offlineDevices,
      devicesByType,
      devicesByRiskLevel,
      recentAlerts
    ] = await Promise.all([
      this.database.device.count({ where }),
      this.database.device.count({ 
        where: { ...where, status: DeviceStatus.ONLINE }
      }),
      this.database.device.count({ 
        where: { ...where, status: DeviceStatus.OFFLINE }
      }),
      this.database.device.groupBy({
        by: ['type'],
        where,
        _count: { type: true }
      }),
      this.database.device.groupBy({
        by: ['riskLevel'],
        where,
        _count: { riskLevel: true }
      }),
      this.database.alert.count({
        where: {
          status: 'ACTIVE',
          device: where.ownerId ? { ownerId: userId } : undefined
        }
      })
    ]);

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      devicesByType: devicesByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
      devicesByRiskLevel: devicesByRiskLevel.reduce((acc, item) => {
        acc[item.riskLevel] = item._count.riskLevel;
        return acc;
      }, {}),
      recentAlerts
    };
  }

  async calculateSecurityScore(deviceId: string): Promise<number> {
    const device = await this.database.device.findUnique({
      where: { id: deviceId },
      include: {
        scans: {
          take: 1,
          orderBy: { startedAt: 'desc' }
        },
        alerts: {
          where: { status: 'ACTIVE' },
          take: 10
        }
      }
    });

    if (!device) return 0;

    let score = 100;

    const latestScan = device.scans[0];
    if (latestScan) {
      score -= latestScan.criticalCount * 20;
      score -= latestScan.highCount * 10;
      score -= latestScan.mediumCount * 5;
      score -= latestScan.lowCount * 1;
    }

    score -= device.alerts.length * 5;

    if (device.status === DeviceStatus.OFFLINE) {
      score -= 10;
    }

    if (!device.firmwareVersion) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  async updateRiskLevel(deviceId: string): Promise<void> {
    const securityScore = await this.calculateSecurityScore(deviceId);
    
    let riskLevel: RiskLevel;
    if (securityScore >= 80) riskLevel = RiskLevel.LOW;
    else if (securityScore >= 60) riskLevel = RiskLevel.MEDIUM;
    else if (securityScore >= 40) riskLevel = RiskLevel.HIGH;
    else riskLevel = RiskLevel.CRITICAL;

    await this.database.device.update({
      where: { id: deviceId },
      data: { 
        securityScore,
        riskLevel 
      }
    });
  }
}

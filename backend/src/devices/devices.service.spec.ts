import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeviceStatus, RiskLevel } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { DevicesService } from './devices.service';

// Exercise real service logic; only persistence is replaced with local fixtures.
describe('DevicesService', () => {
  const database = {
    device: {
      findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(),
      create: jest.fn(), update: jest.fn(), delete: jest.fn(),
    },
  };
  let service: DevicesService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new DevicesService(database as unknown as DatabaseService);
  });

  it('registers a device offline with unknown risk', async () => {
    database.device.findUnique.mockResolvedValue(null);
    database.device.create.mockResolvedValue({ id: 'fixture-device' });
    const dto = { name: 'Lab sensor', macAddress: '02:00:00:00:00:01' };
    await service.create(dto as never, 'fixture-owner');
    expect(database.device.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { ...dto, ownerId: 'fixture-owner', status: DeviceStatus.OFFLINE, riskLevel: RiskLevel.UNKNOWN },
    }));
  });

  it('reports an existing device without creating a duplicate', async () => {
    database.device.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.create({ macAddress: '02:00:00:00:00:01' } as never, 'owner'))
      .rejects.toBeInstanceOf(ConflictException);
    expect(database.device.create).not.toHaveBeenCalled();
  });

  it('reports missing device details', async () => {
    database.device.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing', 'owner', 'USER')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('preserves the owner and search filters in a normal device listing', async () => {
    database.device.findMany.mockResolvedValue([]);
    expect(await service.findAll({ search: 'sensor' }, 'owner', 'USER')).toEqual([]);
    expect(database.device.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ ownerId: 'owner', OR: expect.any(Array) }),
    }));
  });

  it('returns zero for a missing device score', async () => {
    database.device.findUnique.mockResolvedValue(null);
    expect(await service.calculateSecurityScore('missing')).toBe(0);
  });

  it('scores a healthy fixture at 100', async () => {
    database.device.findUnique.mockResolvedValue({ scans: [], alerts: [], status: DeviceStatus.ONLINE, firmwareVersion: '1.0' });
    expect(await service.calculateSecurityScore('fixture')).toBe(100);
  });

  it('applies recorded findings, offline and firmware penalties', async () => {
    database.device.findUnique.mockResolvedValue({
      scans: [{ criticalCount: 1, highCount: 1, mediumCount: 1, lowCount: 1 }],
      alerts: [{}], status: DeviceStatus.OFFLINE, firmwareVersion: null,
    });
    expect(await service.calculateSecurityScore('fixture')).toBe(34);
  });

  it('bounds heavily penalized fixture scores at zero', async () => {
    database.device.findUnique.mockResolvedValue({
      scans: [{ criticalCount: 10, highCount: 0, mediumCount: 0, lowCount: 0 }],
      alerts: [], status: DeviceStatus.ONLINE, firmwareVersion: '1.0',
    });
    expect(await service.calculateSecurityScore('fixture')).toBe(0);
  });

  it.each([
    [80, RiskLevel.LOW], [79, RiskLevel.MEDIUM], [60, RiskLevel.MEDIUM],
    [59, RiskLevel.HIGH], [40, RiskLevel.HIGH], [39, RiskLevel.CRITICAL],
  ])('maps score %s to risk %s', async (score, riskLevel) => {
    jest.spyOn(service, 'calculateSecurityScore').mockResolvedValue(score);
    await service.updateRiskLevel('fixture');
    expect(database.device.update).toHaveBeenCalledWith({
      where: { id: 'fixture' }, data: { securityScore: score, riskLevel },
    });
  });
});

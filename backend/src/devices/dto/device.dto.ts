import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsIP, 
  IsMACAddress, 
  MinLength, 
  MaxLength,
  IsUUID
} from 'class-validator';
import { DeviceType, DeviceStatus, RiskLevel } from '@prisma/client';

export class CreateDeviceDto {
  @ApiProperty({ example: 'Smart Sensor #1' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: DeviceType, example: DeviceType.SENSOR })
  @IsEnum(DeviceType)
  type: DeviceType;

  @ApiProperty({ example: '192.168.1.100' })
  @IsIP()
  ipAddress: string;

  @ApiProperty({ example: '00:1B:44:11:3A:B7' })
  @IsMACAddress()
  macAddress: string;

  @ApiPropertyOptional({ example: 'Raspberry Pi Foundation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'Raspberry Pi 4' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ example: '1.2.3' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firmwareVersion?: string;

  @ApiPropertyOptional({ example: 'Raspbian 11' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  osVersion?: string;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional({ example: 'Updated Smart Sensor #1' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: DeviceType })
  @IsOptional()
  @IsEnum(DeviceType)
  type?: DeviceType;

  @ApiPropertyOptional({ example: '192.168.1.101' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Raspberry Pi Foundation' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'Raspberry Pi 4' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ example: '1.2.4' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firmwareVersion?: string;

  @ApiPropertyOptional({ example: 'Raspbian 11' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  osVersion?: string;

  @ApiPropertyOptional({ enum: DeviceStatus })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;
}

export class DeviceQueryDto {
  @ApiPropertyOptional({ enum: DeviceType })
  @IsOptional()
  @IsEnum(DeviceType)
  type?: DeviceType;

  @ApiPropertyOptional({ enum: DeviceStatus })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @ApiPropertyOptional({ enum: RiskLevel })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ example: 'sensor' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class DeviceHeartbeatDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  deviceId: string;

  @ApiPropertyOptional({ example: 25.6 })
  @IsOptional()
  cpuUsage?: number;

  @ApiPropertyOptional({ example: 60.2 })
  @IsOptional()
  memoryUsage?: number;

  @ApiPropertyOptional({ example: 45.8 })
  @IsOptional()
  diskUsage?: number;

  @ApiPropertyOptional({ example: 42.5 })
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ example: 1024.5 })
  @IsOptional()
  networkIn?: number;

  @ApiPropertyOptional({ example: 512.3 })
  @IsOptional()
  networkOut?: number;

  @ApiPropertyOptional()
  @IsOptional()
  customData?: any;
}

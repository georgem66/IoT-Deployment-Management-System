import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsString, 
  IsOptional, 
  IsUUID, 
  MinLength, 
  MaxLength,
  IsObject
} from 'class-validator';
import { AlertType, AlertSeverity, AlertStatus } from '@prisma/client';

export class CreateAlertDto {
  @ApiPropertyOptional({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the related device (optional)'
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiProperty({ 
    enum: AlertType, 
    example: AlertType.SECURITY_BREACH,
    description: 'Type of alert'
  })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({ 
    enum: AlertSeverity, 
    example: AlertSeverity.HIGH,
    description: 'Severity level of the alert'
  })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ 
    example: 'Security Breach Detected',
    description: 'Alert title'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ 
    example: 'Unusual network activity detected on device sensor-01',
    description: 'Detailed description of the alert'
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({ 
    example: { sourceIp: '192.168.1.100', attempts: 5 },
    description: 'Additional metadata about the alert'
  })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateAlertDto {
  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;
}

export class AlertQueryDto {
  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({ enum: AlertType })
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @ApiPropertyOptional({ enum: AlertSeverity })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ 
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by device ID'
  })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ 
    example: '10',
    description: 'Limit number of results'
  })
  @IsOptional()
  limit?: string;
}

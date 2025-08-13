import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Anomaly Detection')
@Controller('anomaly-detection')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AnomalyDetectionController {
  constructor(private readonly anomalyDetectionService: AnomalyDetectionService) {}

  @Post('analyze/:deviceId')
  @ApiOperation({ 
    summary: 'Analyze a specific device for anomalies',
    description: 'Runs anomaly detection algorithms on device telemetry data'
  })
  @ApiResponse({ status: 201, description: 'Analysis completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async analyzeDevice(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
    const results = await this.anomalyDetectionService.analyzeDevice(deviceId);
    return {
      deviceId,
      anomaliesDetected: results.length,
      anomalies: results,
      timestamp: new Date()
    };
  }

  @Post('analyze-all')
  @ApiOperation({ 
    summary: 'Analyze all online devices for anomalies',
    description: 'Runs anomaly detection on all online devices in the system'
  })
  @ApiResponse({ status: 201, description: 'Bulk analysis completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzeAllDevices() {
    const results = await this.anomalyDetectionService.analyzeAllDevices();
    
    const deviceSummary = results.reduce((acc, anomaly) => {
      if (!acc[anomaly.deviceId]) {
        acc[anomaly.deviceId] = {
          deviceId: anomaly.deviceId,
          deviceName: anomaly.deviceName,
          anomalyCount: 0,
          anomalies: []
        };
      }
      acc[anomaly.deviceId].anomalyCount++;
      acc[anomaly.deviceId].anomalies.push({
        type: anomaly.anomalyType,
        severity: anomaly.severity,
        description: anomaly.description
      });
      return acc;
    }, {});

    return {
      totalAnomalies: results.length,
      devicesAnalyzed: Object.keys(deviceSummary).length,
      deviceSummary: Object.values(deviceSummary),
      timestamp: new Date()
    };
  }

  @Get('history/:deviceId')
  @ApiOperation({ 
    summary: 'Get anomaly detection history for a device',
    description: 'Retrieves historical anomaly detection results for a specific device'
  })
  @ApiResponse({ status: 200, description: 'Anomaly history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days to look back (default: 7)' })
  async getAnomalyHistory(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Query('days') days?: string
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const history = await this.anomalyDetectionService.getAnomalyHistory(deviceId, daysNum);
    
    return {
      deviceId,
      period: `${daysNum} days`,
      anomalies: history,
      totalCount: history.length
    };
  }

  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get anomaly detection statistics',
    description: 'Provides overview statistics about anomaly detection across the system'
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatistics(@CurrentUser() user) {
    return this.anomalyDetectionService.getAnomalyStatistics(user.id, user.role);
  }

  @Get('rules')
  @ApiOperation({ 
    summary: 'Get available anomaly detection rules',
    description: 'Lists all configured anomaly detection rules and their criteria'
  })
  @ApiResponse({ status: 200, description: 'Anomaly detection rules retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnomalyRules() {
    const stats = await this.anomalyDetectionService.getAnomalyStatistics('', 'ADMIN');
    return {
      rules: stats.rules,
      totalRules: stats.rules.length
    };
  }
}

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Telemetry')
@Controller('telemetry')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('device/:deviceId')
  @ApiOperation({ summary: 'Get telemetry data for a specific device' })
  @ApiResponse({ status: 200, description: 'Telemetry data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found or access denied' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for data range (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for data range (ISO 8601)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of records to return' })
  async getDeviceTelemetry(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any
  ) {
    const query = {
      deviceId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    return this.telemetryService.getTelemetryData(query, user.id, user.role);
  }

  @Get('device/:deviceId/stats')
  @ApiOperation({ summary: 'Get telemetry statistics for a specific device' })
  @ApiResponse({ status: 200, description: 'Telemetry statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found or access denied' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for statistics range (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for statistics range (ISO 8601)' })
  async getDeviceTelemetryStats(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: any
  ) {
    return this.telemetryService.getTelemetryStats(
      deviceId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      user.id,
      user.role
    );
  }

  @Get('device/:deviceId/recent')
  @ApiOperation({ summary: 'Get recent telemetry data for a specific device' })
  @ApiResponse({ status: 200, description: 'Recent telemetry data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found or access denied' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recent records to return (default: 20)' })
  async getRecentTelemetry(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.telemetryService.getRecentTelemetry(deviceId, limitNum, user.id, user.role);
  }

  @Get('device/:deviceId/health')
  @ApiOperation({ 
    summary: 'Get device health score based on telemetry data',
    description: 'Returns a health score (0-100) and detailed factors affecting device performance'
  })
  @ApiResponse({ status: 200, description: 'Device health score calculated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found or access denied' })
  async getDeviceHealth(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @CurrentUser() user?: any
  ) {
    await this.telemetryService.getRecentTelemetry(deviceId, 1, user.id, user.role);
    
    return this.telemetryService.getDeviceHealthScore(deviceId);
  }
}

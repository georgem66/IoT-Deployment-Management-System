import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto, UpdateAlertDto, AlertQueryDto } from './dto/alerts.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createAlertDto: CreateAlertDto,
    @CurrentUser() user
  ) {
    return this.alertsService.create(createAlertDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts (filtered by user access)' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED'] })
  @ApiQuery({ name: 'type', required: false, enum: ['SECURITY_BREACH', 'DEVICE_OFFLINE', 'HIGH_CPU_USAGE', 'HIGH_MEMORY_USAGE', 'ANOMALY_DETECTED', 'VULNERABILITY_FOUND', 'FIRMWARE_OUTDATED', 'AUTHENTICATION_FAILURE', 'NETWORK_INTRUSION'] })
  @ApiQuery({ name: 'severity', required: false, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] })
  @ApiQuery({ name: 'deviceId', required: false, description: 'Filter by device UUID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  async findAll(
    @Query() query: AlertQueryDto,
    @CurrentUser() user
  ) {
    return this.alertsService.findAll(query, user.id, user.role);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get alert statistics and dashboard data' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatistics(@CurrentUser() user) {
    return this.alertsService.getAlertStatistics(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found or access denied' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user
  ) {
    return this.alertsService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update alert status' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found or access denied' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAlertDto: UpdateAlertDto,
    @CurrentUser() user
  ) {
    return this.alertsService.update(id, updateAlertDto, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found or access denied' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user
  ) {
    await this.alertsService.remove(id, user.id, user.role);
    return { message: 'Alert deleted successfully' };
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found or access denied' })
  async acknowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user
  ) {
    return this.alertsService.update(id, { status: 'ACKNOWLEDGED' }, user.id, user.role);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found or access denied' })
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user
  ) {
    return this.alertsService.update(id, { status: 'RESOLVED' }, user.id, user.role);
  }
}

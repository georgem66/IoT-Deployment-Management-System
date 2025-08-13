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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiTags, 
  ApiBearerAuth, 
  ApiOperation, 
  ApiResponse,
  ApiQuery 
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { 
  CreateDeviceDto, 
  UpdateDeviceDto, 
  DeviceQueryDto,
  DeviceHeartbeatDto 
} from './dto/device.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Devices')
@Controller('devices')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new IoT device' })
  @ApiResponse({ status: 201, description: 'Device registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Device with MAC address already exists' })
  async create(
    @Body() createDeviceDto: CreateDeviceDto,
    @CurrentUser() user
  ) {
    return this.devicesService.create(createDeviceDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices (filtered by user role)' })
  @ApiResponse({ status: 200, description: 'Devices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'type', required: false, enum: ['SENSOR', 'CAMERA', 'GATEWAY', 'ACTUATOR', 'CONTROLLER', 'OTHER'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR'] })
  @ApiQuery({ name: 'riskLevel', required: false, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'] })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, manufacturer, model, or IP' })
  async findAll(
    @Query() query: DeviceQueryDto,
    @CurrentUser() user
  ) {
    return this.devicesService.findAll(query, user.id, user.role);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get device statistics and overview' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatistics(@CurrentUser() user) {
    return this.devicesService.getDeviceStatistics(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID with detailed information' })
  @ApiResponse({ status: 200, description: 'Device retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found or access denied' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user
  ) {
    return this.devicesService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device information' })
  @ApiResponse({ status: 200, description: 'Device updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found or access denied' })
  async update(
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
    @CurrentUser() user
  ) {
    return this.devicesService.update(id, updateDeviceDto, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete device' })
  @ApiResponse({ status: 200, description: 'Device deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found or access denied' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user
  ) {
    await this.devicesService.remove(id, user.id, user.role);
    return { message: 'Device deleted successfully' };
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Device heartbeat and telemetry data submission',
    description: 'Endpoint for IoT devices to send periodic status updates and telemetry data'
  })
  @ApiResponse({ status: 200, description: 'Heartbeat received successfully' })
  @ApiResponse({ status: 400, description: 'Invalid device ID or data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async heartbeat(@Body() heartbeatDto: DeviceHeartbeatDto) {
    await this.devicesService.updateHeartbeat(heartbeatDto.deviceId, heartbeatDto);
    return { message: 'Heartbeat received' };
  }

  @Post(':id/calculate-security-score')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalculate security score for device' })
  @ApiResponse({ status: 200, description: 'Security score calculated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found or access denied' })
  async calculateSecurityScore(
    @Param('id') id: string,
    @CurrentUser() user
  ) {
    await this.devicesService.findOne(id, user.id, user.role);
    
    const score = await this.devicesService.calculateSecurityScore(id);
    await this.devicesService.updateRiskLevel(id);
    
    return { 
      deviceId: id,
      securityScore: score,
      message: 'Security score calculated successfully' 
    };
  }
}

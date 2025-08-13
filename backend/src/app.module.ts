import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { VulnerabilityModule } from './vulnerability/vulnerability.module';
import { AlertsModule } from './alerts/alerts.module';
import { AnomalyDetectionModule } from './anomaly-detection/anomaly-detection.module';
import { FirmwareModule } from './firmware/firmware.module';
import { AuditModule } from './audit/audit.module';
import { NotificationModule } from './notification/notification.module';
import { ExportModule } from './export/export.module';

import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),

    DatabaseModule,
    AuthModule,
    UsersModule,
    DevicesModule,
    TelemetryModule,
    VulnerabilityModule,
    AlertsModule,
    AnomalyDetectionModule,
    FirmwareModule,
    AuditModule,
    NotificationModule,
    ExportModule,
    WebSocketModule,
  ],
})
export class AppModule {}

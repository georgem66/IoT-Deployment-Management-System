import { Module } from '@nestjs/common';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { AnomalyDetectionController } from './anomaly-detection.controller';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [AnomalyDetectionController],
  providers: [AnomalyDetectionService],
  exports: [AnomalyDetectionService],
})
export class AnomalyDetectionModule {}

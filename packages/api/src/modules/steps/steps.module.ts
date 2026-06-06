import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';
import { StepsRepository } from './steps.repository';
import { StepEntity } from './entities/step.entity';
import { HuntsModule } from '../hunts/hunts.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StepEntity]),
    forwardRef(() => HuntsModule),
    FilesModule,
  ],
  controllers: [StepsController],
  providers: [StepsService, StepsRepository],
  exports: [StepsService, StepsRepository],
})
export class StepsModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HuntsModule } from './modules/hunts/hunts.module';
import { StepsModule } from './modules/steps/steps.module';
import { ProgressModule } from './modules/progress/progress.module';
import { BadgesModule } from './modules/badges/badges.module';
import { GeoModule } from './modules/geo/geo.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    HuntsModule,
    StepsModule,
    ProgressModule,
    BadgesModule,
    GeoModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

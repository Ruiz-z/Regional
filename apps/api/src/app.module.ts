import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { loadConfig } from './config/configuration';
import { IdentityModule } from './modules/identity/identity.module';
import { ParcelsModule } from './modules/parcels/parcels.module';
import { DevicesModule } from './modules/devices/devices.module';
import { IrrigationModule } from './modules/irrigation/irrigation.module';
import { PestModule } from './modules/pest/pest.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadConfig] }),
    PrismaModule,
    IdentityModule,
    ParcelsModule,
    DevicesModule,
    IrrigationModule,
    PestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

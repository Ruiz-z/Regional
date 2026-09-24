import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { loadConfig } from './config/configuration';
import { IdentityModule } from './modules/identity/identity.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [loadConfig] }),
    PrismaModule,
    IdentityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

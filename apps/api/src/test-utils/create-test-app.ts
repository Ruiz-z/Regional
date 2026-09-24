import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

export const TEST_JWT_SECRET = 'test-secret';

export async function createTestApp() {
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.JWT_EXPIRES_IN = String(86400);
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.init();
  return { app, moduleFixture };
}

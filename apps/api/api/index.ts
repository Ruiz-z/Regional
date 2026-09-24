// Punto de entrada serverless para Vercel. `src/main.ts` sigue siendo el
// entrypoint para Docker/local (app.listen()); este archivo reusa el mismo
// AppModule pero expone el adaptador Express de Nest como handler
// (req,res) => void, que es lo que Vercel espera de una función Node.
// El bootstrap se cachea en el scope del módulo para reutilizarse entre
// invocaciones en un mismo contenedor "warm" (evita reinicializar Nest en
// cada request).
import type { IncomingMessage, ServerResponse } from 'http';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

const expressApp = express();
let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.init();
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  bootstrapped ??= bootstrap();
  await bootstrapped;
  expressApp(req, res);
}

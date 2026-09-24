import {
  ArgumentsHost,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const json = jest.fn(() => undefined);
  const status = jest.fn(() => ({ json }));
  const res = { status };
  const req = { method: 'GET', url: '/prueba' };

  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  } as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve JSON {statusCode, message} para HttpException', () => {
    const filter = new AllExceptionsFilter();
    filter.catch(new UnauthorizedException('credenciales inválidas'), host);
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'credenciales inválidas',
    });
  });

  it('respeta el array de message de un ValidationPipe', () => {
    const filter = new AllExceptionsFilter();
    filter.catch(new NotFoundException(['a', 'b']), host);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: ['a', 'b'],
    });
  });

  it('no expone stack de errores no controlados', () => {
    const filter = new AllExceptionsFilter();
    const boom = new Error('boom interno');
    filter.catch(boom, host);
    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(body).toEqual({
      statusCode: 500,
      message: 'Error interno del servidor',
    });
    expect(JSON.stringify(body)).not.toContain('at ');
  });
});

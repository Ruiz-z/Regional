import { ExecutionContext, HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  interface TestHttpHost {
    switchToHttp: () => {
      getRequest: () => { method: string; url: string };
      getResponse: () => { statusCode: number };
    };
  }

  const mockContext = (): ExecutionContext => {
    const httpHost: TestHttpHost = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', url: '/readings' }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    };
    return httpHost as unknown as ExecutionContext;
  };

  it('logea el request cuando el handler termina bien', (done) => {
    const interceptor = new LoggingInterceptor();
    const next = { handle: () => of('ok') };

    const result$ = interceptor.intercept(mockContext(), next as never);
    result$.subscribe({
      next: (value) => expect(value).toBe('ok'),
      error: (err: unknown) => {
        done(err);
      },
      complete: () => {
        done();
      },
    });
  });

  it('re-lanza el error y lo logea cuando el handler falla', (done) => {
    const interceptor = new LoggingInterceptor();
    const boom = new HttpException('nope', 403);
    const next = { handle: () => throwError(() => boom) };

    interceptor.intercept(mockContext(), next as never).subscribe({
      error: (error: unknown) => {
        expect(error).toBe(boom);
        done();
      },
    });
  });
});

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface DeviceRequest {
  device: {
    id: string;
    zoneId: string | null;
    type: string;
    apiKeyHash: string;
  };
}

export const CurrentDevice = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<DeviceRequest>();
    return request.device;
  },
);

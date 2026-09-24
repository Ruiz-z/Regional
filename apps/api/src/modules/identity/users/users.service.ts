import { ConflictException, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Prisma, User, UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const role = dto.role ?? UserRole.AGRICULTOR;
    const passwordHash = await this.hashPassword(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, passwordHash, role },
      });
      await this.notifications.sendWelcomeEmail(user.email);
      return user;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }
}

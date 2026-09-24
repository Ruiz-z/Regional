import { ConflictException, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Prisma, User, UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<User> {
    const role = dto.role ?? UserRole.AGRICULTOR;
    const passwordHash = await this.hashPassword(dto.password);
    try {
      return await this.prisma.user.create({
        data: { email: dto.email, passwordHash, role },
      });
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

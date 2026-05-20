import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluatorDto } from './dto/create-evaluator.dto';
import { UpdateEvaluatorDto } from './dto/update-evaluator.dto';

const evaluatorSelect = {
  id: true,
  email: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class HrEvaluatorsService {
  constructor(private prisma: PrismaService) {}

  listForHr() {
    return this.prisma.user.findMany({
      where: { role: UserRole.EVALUATOR },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
      select: evaluatorSelect,
    });
  }

  async create(dto: CreateEvaluatorDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.EVALUATOR,
        name: dto.name?.trim() || null,
        isActive: true,
      },
      select: evaluatorSelect,
    });
  }

  async update(evaluatorId: string, dto: UpdateEvaluatorDto) {
    const user = await this.findEvaluatorOrThrow(evaluatorId);

    const data: { email?: string; name?: string | null; passwordHash?: string } = {};

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (email !== user.email) {
        const taken = await this.prisma.user.findUnique({ where: { email } });
        if (taken) {
          throw new ConflictException('A user with this email already exists.');
        }
        data.email = email;
      }
    }

    if (dto.name !== undefined) {
      data.name = dto.name.trim() || null;
    }

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No changes provided.');
    }

    return this.prisma.user.update({
      where: { id: evaluatorId },
      data,
      select: evaluatorSelect,
    });
  }

  async setActive(evaluatorId: string, isActive: boolean) {
    await this.findEvaluatorOrThrow(evaluatorId);
    return this.prisma.user.update({
      where: { id: evaluatorId },
      data: { isActive },
      select: evaluatorSelect,
    });
  }

  private async findEvaluatorOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== UserRole.EVALUATOR) {
      throw new NotFoundException('Evaluator not found');
    }
    return user;
  }
}

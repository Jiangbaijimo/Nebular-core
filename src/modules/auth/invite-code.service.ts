import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteCode } from './entities/invite-code.entity';
import { User } from '../user/entities/user.entity';
import { GenerateInviteCodeDto } from './dto/auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class InviteCodeService {
  constructor(
    @InjectRepository(InviteCode)
    private inviteCodeRepository: Repository<InviteCode>,
  ) {}

  /**
   * 生成邀请码
   */
  async generateInviteCode(
    createdByUserId: number,
    generateDto: GenerateInviteCodeDto,
  ): Promise<InviteCode> {
    const { expiresIn = '7d', note } = generateDto;

    // 生成唯一的邀请码
    let code: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = this.generateRandomCode();
      const existing = await this.inviteCodeRepository.findOne({
        where: { code },
      });
      isUnique = !existing;
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('生成邀请码失败，请重试');
    }

    // 计算过期时间
    const expiresAt = this.calculateExpirationDate(expiresIn);

    const inviteCode = this.inviteCodeRepository.create({
      code,
      expiresAt,
      createdByUserId,
      note,
    });

    return this.inviteCodeRepository.save(inviteCode);
  }

  /**
   * 验证邀请码
   */
  async validateInviteCode(code: string): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { code },
      relations: ['createdBy', 'usedBy'],
    });

    if (!inviteCode) {
      throw new NotFoundException('邀请码不存在');
    }

    if (inviteCode.isUsed) {
      throw new BadRequestException('邀请码已被使用');
    }

    if (inviteCode.expiresAt < new Date()) {
      throw new BadRequestException('邀请码已过期');
    }

    return inviteCode;
  }

  /**
   * 使用邀请码
   */
  async useInviteCode(code: string, usedByUserId: number): Promise<void> {
    const inviteCode = await this.validateInviteCode(code);

    inviteCode.isUsed = true;
    inviteCode.usedAt = new Date();
    inviteCode.usedByUserId = usedByUserId;

    await this.inviteCodeRepository.save(inviteCode);
  }

  /**
   * 获取用户创建的邀请码列表
   */
  async getInviteCodesByUser(
    userId: number,
    options: {
      page?: number;
      limit?: number;
      includeUsed?: boolean;
    } = {},
  ): Promise<{
    data: InviteCode[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, includeUsed = true } = options;

    const queryBuilder = this.inviteCodeRepository
      .createQueryBuilder('inviteCode')
      .leftJoinAndSelect('inviteCode.createdBy', 'createdBy')
      .leftJoinAndSelect('inviteCode.usedBy', 'usedBy')
      .where('inviteCode.createdByUserId = :userId', { userId });

    if (!includeUsed) {
      queryBuilder.andWhere('inviteCode.isUsed = :isUsed', { isUsed: false });
    }

    queryBuilder
      .orderBy('inviteCode.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [inviteCodes, total] = await queryBuilder.getManyAndCount();

    return {
      data: inviteCodes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取所有邀请码（管理员用）
   */
  async getAllInviteCodes(options: {
    page?: number;
    limit?: number;
    includeUsed?: boolean;
  } = {}): Promise<{
    data: InviteCode[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, includeUsed = true } = options;

    const queryBuilder = this.inviteCodeRepository
      .createQueryBuilder('inviteCode')
      .leftJoinAndSelect('inviteCode.createdBy', 'createdBy')
      .leftJoinAndSelect('inviteCode.usedBy', 'usedBy');

    if (!includeUsed) {
      queryBuilder.where('inviteCode.isUsed = :isUsed', { isUsed: false });
    }

    queryBuilder
      .orderBy('inviteCode.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [inviteCodes, total] = await queryBuilder.getManyAndCount();

    return {
      data: inviteCodes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 删除邀请码
   */
  async deleteInviteCode(id: number, userId: number): Promise<void> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { id },
    });

    if (!inviteCode) {
      throw new NotFoundException('邀请码不存在');
    }

    if (inviteCode.createdByUserId !== userId) {
      throw new BadRequestException('只能删除自己创建的邀请码');
    }

    if (inviteCode.isUsed) {
      throw new BadRequestException('已使用的邀请码不能删除');
    }

    await this.inviteCodeRepository.remove(inviteCode);
  }

  /**
   * 清理过期的邀请码
   */
  async cleanupExpiredInviteCodes(): Promise<number> {
    const result = await this.inviteCodeRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now AND isUsed = :isUsed', {
        now: new Date(),
        isUsed: false,
      })
      .execute();

    return result.affected || 0;
  }

  /**
   * 生成随机邀请码
   */
  private generateRandomCode(): string {
    // 生成8位随机字符串，包含大小写字母和数字
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 计算过期时间
   */
  private calculateExpirationDate(duration: string): Date {
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      throw new BadRequestException('无效的过期时间格式');
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    const now = new Date();

    switch (unit) {
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 's':
        return new Date(now.getTime() + value * 1000);
      default:
        throw new BadRequestException('无效的时间单位');
    }
  }
}
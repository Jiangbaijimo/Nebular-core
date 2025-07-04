import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus, AuthProvider } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    
    // 为新用户分配默认角色
    const defaultRole = await this.roleRepository.findOne({
      where: { code: 'user' },
    });
    
    if (defaultRole) {
      user.roles = [defaultRole];
    }

    return this.userRepository.save(user);
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: UserStatus;
    search?: string;
  } = {}): Promise<{ data: User[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 10, status, search } = options;
    
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions');

    // 状态过滤
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // 搜索
    if (search) {
      queryBuilder.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.nickname ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 排序和分页
    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByProviderId(
    providerId: string,
    provider: AuthProvider,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { providerId, provider },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    Object.assign(user, updateUserDto);
    
    return this.userRepository.save(user);
  }

  async updateLastLogin(id: number, ip?: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async bindOAuthAccount(
    userId: number,
    oauthData: { provider: AuthProvider; providerId: string },
  ): Promise<void> {
    await this.userRepository.update(userId, {
      provider: oauthData.provider,
      providerId: oauthData.providerId,
    });
  }

  async assignRole(userId: number, roleId: number): Promise<User> {
    const user = await this.findById(userId);
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (!user.roles.find(r => r.id === roleId)) {
      user.roles.push(role);
      await this.userRepository.save(user);
    }

    return this.findById(userId);
  }

  async removeRole(userId: number, roleId: number): Promise<User> {
    const user = await this.findById(userId);
    
    user.roles = user.roles.filter(role => role.id !== roleId);
    await this.userRepository.save(user);

    return this.findById(userId);
  }

  async changeStatus(id: number, status: UserStatus): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  async getStats(): Promise<any> {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({
      where: { status: UserStatus.ACTIVE },
    });
    const inactive = await this.userRepository.count({
      where: { status: UserStatus.INACTIVE },
    });
    const banned = await this.userRepository.count({
      where: { status: UserStatus.BANNED },
    });

    return {
      total,
      active,
      inactive,
      banned,
    };
  }
}
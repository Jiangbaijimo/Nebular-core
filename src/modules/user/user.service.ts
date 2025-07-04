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
    
    // 检查是否为第一个用户
    const userCount = await this.userRepository.count();
    
    if (userCount === 0) {
      // 第一个用户自动获得超级管理员权限
      const adminRole = await this.roleRepository.findOne({
        where: { code: 'admin' },
      });
      
      if (adminRole) {
        user.roles = [adminRole];
      } else {
        // 如果没有管理员角色，创建一个
        const newAdminRole = this.roleRepository.create({
          name: '超级管理员',
          code: 'admin',
          description: '系统超级管理员，拥有所有权限',
          isSystem: true,
        });
        const savedAdminRole = await this.roleRepository.save(newAdminRole);
        user.roles = [savedAdminRole];
      }
    } else {
      // 为普通用户分配默认角色
      const defaultRole = await this.roleRepository.findOne({
        where: { code: 'user' },
      });
      
      if (defaultRole) {
        user.roles = [defaultRole];
      }
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
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.avatar',
        'user.nickname',
        'user.bio',
        'user.status',
        'user.provider',
        'user.providerId',
        'user.emailVerified',
        'user.lastLoginAt',
        'user.lastLoginIp',
        'user.createdAt',
        'user.updatedAt',
        'roles.id',
        'roles.name',
        'roles.code',
        'roles.description',
        'roles.isActive',
        'roles.isSystem',
        'permissions.id',
        'permissions.name',
        'permissions.code',
        'permissions.action',
        'permissions.resource',
        'permissions.description',
        'permissions.isActive',
      ]);

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
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.avatar',
        'user.nickname',
        'user.bio',
        'user.status',
        'user.provider',
        'user.providerId',
        'user.emailVerified',
        'user.lastLoginAt',
        'user.lastLoginIp',
        'user.createdAt',
        'user.updatedAt',
        'roles.id',
        'roles.name',
        'roles.code',
        'roles.description',
        'roles.isActive',
        'roles.isSystem',
        'permissions.id',
        'permissions.name',
        'permissions.code',
        'permissions.action',
        'permissions.resource',
        'permissions.description',
        'permissions.isActive',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.avatar',
        'user.nickname',
        'user.bio',
        'user.status',
        'user.provider',
        'user.providerId',
        'user.emailVerified',
        'user.lastLoginAt',
        'user.lastLoginIp',
        'user.createdAt',
        'user.updatedAt',
        'roles.id',
        'roles.name',
        'roles.code',
        'roles.description',
        'roles.isActive',
        'roles.isSystem',
        'permissions.id',
        'permissions.name',
        'permissions.code',
        'permissions.action',
        'permissions.resource',
        'permissions.description',
        'permissions.isActive',
      ])
      .where('user.email = :email', { email })
      .getOne();

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.avatar',
        'user.nickname',
        'user.bio',
        'user.status',
        'user.provider',
        'user.providerId',
        'user.emailVerified',
        'user.lastLoginAt',
        'user.lastLoginIp',
        'user.createdAt',
        'user.updatedAt',
        'roles.id',
        'roles.name',
        'roles.code',
        'roles.description',
        'roles.isActive',
        'roles.isSystem',
        'permissions.id',
        'permissions.name',
        'permissions.code',
        'permissions.action',
        'permissions.resource',
        'permissions.description',
        'permissions.isActive',
      ])
      .where('user.username = :username', { username })
      .getOne();

    return user;
  }

  // 内部方法：用于认证时获取包含密码的用户信息
  async findByProviderId(providerId: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.avatar',
        'user.nickname',
        'user.bio',
        'user.status',
        'user.provider',
        'user.providerId',
        'user.emailVerified',
        'user.lastLoginAt',
        'user.lastLoginIp',
        'user.createdAt',
        'user.updatedAt',
        'roles.id',
        'roles.name',
        'roles.code',
        'roles.description',
        'roles.isActive',
        'roles.isSystem',
        'permissions.id',
        'permissions.name',
        'permissions.code',
        'permissions.action',
        'permissions.resource',
        'permissions.description',
        'permissions.isActive',
      ])
      .where('user.providerId = :providerId', { providerId })
      .getOne();

    return user;
  }

  // 内部方法：用于认证时获取包含密码的用户信息
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByUsernameWithPassword(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByProviderIdAndProvider(
    providerId: string,
    provider: AuthProvider,
  ): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .select([
        'user.id',
        'user.email',
        'user.username',
        'user.avatar',
        'user.nickname',
        'user.bio',
        'user.status',
        'user.provider',
        'user.providerId',
        'user.emailVerified',
        'user.lastLoginAt',
        'user.lastLoginIp',
        'user.createdAt',
        'user.updatedAt',
        'roles.id',
        'roles.name',
        'roles.code',
        'roles.description',
        'roles.isActive',
        'roles.isSystem',
        'permissions.id',
        'permissions.name',
        'permissions.code',
        'permissions.action',
        'permissions.resource',
        'permissions.description',
        'permissions.isActive',
      ])
      .where('user.providerId = :providerId AND user.provider = :provider', { providerId, provider })
      .getOne();

    return user;
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
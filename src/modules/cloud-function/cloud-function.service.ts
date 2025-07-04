import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { VM } from 'vm2';
import { CloudFunction, CloudFunctionType, CloudFunctionMethod, CloudFunctionStatus } from './entities/cloud-function.entity';
import { CloudFunctionSecret } from './entities/cloud-function-secret.entity';
import { CloudFunctionLog, LogLevel } from './entities/cloud-function-log.entity';
import { CreateCloudFunctionDto } from './dto/create-cloud-function.dto';
import { UpdateCloudFunctionDto } from './dto/update-cloud-function.dto';
import { QueryCloudFunctionDto } from './dto/query-cloud-function.dto';
import { CreateCloudFunctionSecretDto, UpdateCloudFunctionSecretDto } from './dto/create-cloud-function-secret.dto';
import { User } from '../user/entities/user.entity';
import { PermissionAction, PermissionResource } from '../user/entities/permission.entity';
import { PaginationResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class CloudFunctionService {
  private readonly logger = new Logger(CloudFunctionService.name);

  constructor(
    @InjectRepository(CloudFunction)
    private cloudFunctionRepository: Repository<CloudFunction>,
    @InjectRepository(CloudFunctionSecret)
    private secretRepository: Repository<CloudFunctionSecret>,
    @InjectRepository(CloudFunctionLog)
    private logRepository: Repository<CloudFunctionLog>,
  ) {}

  /**
   * 创建云函数
   */
  async create(createDto: CreateCloudFunctionDto, author: User): Promise<CloudFunction> {
    // 检查名称是否已存在
    const existingFunction = await this.cloudFunctionRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingFunction) {
      throw new BadRequestException('云函数名称已存在');
    }

    // 验证函数代码（如果是函数类型）
    if (createDto.type === CloudFunctionType.FUNCTION) {
      this.validateFunctionCode(createDto.content);
    }

    // 验证JSON格式（如果是JSON类型）
    if (createDto.type === CloudFunctionType.JSON) {
      try {
        JSON.parse(createDto.content);
      } catch (error) {
        throw new BadRequestException('JSON格式无效');
      }
    }

    const cloudFunction = this.cloudFunctionRepository.create({
      ...createDto,
      author,
      authorId: author.id,
    });

    const saved = await this.cloudFunctionRepository.save(cloudFunction);
    this.logger.log(`云函数 ${saved.name} 创建成功`);
    
    return saved;
  }

  /**
   * 查询云函数列表
   */
  async findAll(queryDto: QueryCloudFunctionDto): Promise<PaginationResult<CloudFunction>> {
    const { page = 1, limit = 10, search, type, method, status, isPublic, authorId } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.cloudFunctionRepository
      .createQueryBuilder('cf')
      .leftJoinAndSelect('cf.author', 'author')
      .leftJoinAndSelect('cf.secrets', 'secrets')
      .select([
        'cf.id',
        'cf.name',
        'cf.reference',
        'cf.description',
        'cf.type',
        'cf.method',
        'cf.status',
        'cf.isPublic',
        'cf.callCount',
        'cf.lastCalledAt',
        'cf.createdAt',
        'cf.updatedAt',
        'author.id',
        'author.username',
        'author.nickname',
        'secrets.id',
        'secrets.key',
        'secrets.description',
        'secrets.isActive',
      ]);

    if (search) {
      queryBuilder.andWhere(
        '(cf.name LIKE :search OR cf.reference LIKE :search OR cf.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('cf.type = :type', { type });
    }

    if (method) {
      queryBuilder.andWhere('cf.method = :method', { method });
    }

    if (status) {
      queryBuilder.andWhere('cf.status = :status', { status });
    }

    if (typeof isPublic === 'boolean') {
      queryBuilder.andWhere('cf.isPublic = :isPublic', { isPublic });
    }

    if (authorId) {
      queryBuilder.andWhere('cf.authorId = :authorId', { authorId });
    }

    queryBuilder
      .orderBy('cf.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * 根据ID查询云函数
   */
  async findOne(id: number): Promise<CloudFunction> {
    const cloudFunction = await this.cloudFunctionRepository.findOne({
      where: { id },
      relations: ['author', 'secrets'],
    });

    if (!cloudFunction) {
      throw new NotFoundException('云函数不存在');
    }

    return cloudFunction;
  }

  /**
   * 根据引用名称查询云函数
   */
  async findByReference(reference: string): Promise<CloudFunction> {
    const cloudFunction = await this.cloudFunctionRepository.findOne({
      where: { reference, status: CloudFunctionStatus.ACTIVE },
      relations: ['author', 'secrets'],
    });

    if (!cloudFunction) {
      throw new NotFoundException('云函数不存在');
    }

    return cloudFunction;
  }

  /**
   * 更新云函数
   */
  async update(id: number, updateDto: UpdateCloudFunctionDto, user: User): Promise<CloudFunction> {
    const cloudFunction = await this.findOne(id);

    // 权限检查
    if (!this.canModify(cloudFunction, user)) {
      throw new ForbiddenException('没有权限修改此云函数');
    }

    // 如果更新名称，检查是否重复
    if (updateDto.name && updateDto.name !== cloudFunction.name) {
      const existingFunction = await this.cloudFunctionRepository.findOne({
        where: { name: updateDto.name },
      });

      if (existingFunction) {
        throw new BadRequestException('云函数名称已存在');
      }
    }

    // 验证函数代码
    if (updateDto.content && updateDto.type === CloudFunctionType.FUNCTION) {
      this.validateFunctionCode(updateDto.content);
    }

    // 验证JSON格式
    if (updateDto.content && updateDto.type === CloudFunctionType.JSON) {
      try {
        JSON.parse(updateDto.content);
      } catch (error) {
        throw new BadRequestException('JSON格式无效');
      }
    }

    Object.assign(cloudFunction, updateDto);
    const updated = await this.cloudFunctionRepository.save(cloudFunction);
    
    this.logger.log(`云函数 ${updated.name} 更新成功`);
    return updated;
  }

  /**
   * 删除云函数
   */
  async remove(id: number, user: User): Promise<void> {
    const cloudFunction = await this.findOne(id);

    // 权限检查
    if (!this.canModify(cloudFunction, user)) {
      throw new ForbiddenException('没有权限删除此云函数');
    }

    await this.cloudFunctionRepository.remove(cloudFunction);
    this.logger.log(`云函数 ${cloudFunction.name} 删除成功`);
  }

  /**
   * 执行云函数
   */
  async execute(
    reference: string,
    method: string,
    requestData: any,
    headers: Record<string, string>,
    ip: string,
    userAgent: string,
  ): Promise<any> {
    const startTime = Date.now();
    let logData: Partial<CloudFunctionLog> = {
      level: LogLevel.INFO,
      requestData,
      headers,
      ip,
      userAgent,
    };

    try {
      const cloudFunction = await this.findByReference(reference);
      
      // 检查请求方法
      if (cloudFunction.method !== 'ALL' && cloudFunction.method !== method.toUpperCase()) {
        throw new BadRequestException(`不支持的请求方法: ${method}`);
      }

      // 更新调用统计
      await this.updateCallStats(cloudFunction.id);

      let result: any;

      if (cloudFunction.type === CloudFunctionType.JSON) {
        // JSON类型直接返回解析后的数据
        result = JSON.parse(cloudFunction.content);
      } else {
        // 函数类型需要执行代码
        result = await this.executeFunctionCode(
          cloudFunction,
          requestData,
          headers,
          ip,
          userAgent,
        );
      }

      const executionTime = Date.now() - startTime;
      logData = {
        ...logData,
        message: '云函数执行成功',
        responseData: result,
        executionTime,
        statusCode: 200,
        cloudFunctionId: cloudFunction.id,
      };

      // 记录日志
      await this.createLog(logData);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logData = {
        ...logData,
        level: LogLevel.ERROR,
        message: error.message || '云函数执行失败',
        executionTime,
        statusCode: error.status || 500,
        errorStack: error.stack,
      };

      // 查找云函数ID（如果存在）
      try {
        const cloudFunction = await this.cloudFunctionRepository.findOne({
          where: { reference },
        });
        if (cloudFunction) {
          logData.cloudFunctionId = cloudFunction.id;
          // 更新错误信息
          await this.cloudFunctionRepository.update(cloudFunction.id, {
            lastError: error.message,
          });
        }
      } catch (findError) {
        // 忽略查找错误
      }

      // 记录错误日志
      await this.createLog(logData);

      throw error;
    }
  }

  /**
   * 执行函数代码
   */
  private async executeFunctionCode(
    cloudFunction: CloudFunction,
    requestData: any,
    headers: Record<string, string>,
    ip: string,
    userAgent: string,
  ): Promise<any> {
    try {
      // 准备密钥对象
      const secrets: Record<string, string> = {};
      for (const secret of cloudFunction.secrets.filter(s => s.isActive)) {
        secrets[secret.key] = secret.value;
      }

      // 创建上下文对象
      const context = {
        req: {
          body: requestData,
          headers,
          ip,
          userAgent,
          method: 'POST', // 简化处理
        },
        secret: secrets,
        storage: {
          cache: {
            get: async (key: string) => {
              // 这里可以集成Redis或其他缓存系统
              return null;
            },
            set: async (key: string, value: any, ttl?: number) => {
              // 这里可以集成Redis或其他缓存系统
              return true;
            },
            del: async (key: string) => {
              // 这里可以集成Redis或其他缓存系统
              return true;
            },
          },
        },
        broadcast: (event: string, data: any) => {
          // 这里可以集成WebSocket广播功能
          this.logger.log(`广播事件: ${event}`, data);
        },
        throws: (status: number, message: string) => {
          const error = new Error(message);
          (error as any).status = status;
          throw error;
        },
        status: (code: number) => {
          // 设置状态码
        },
        isAuthenticated: false, // 这里可以根据实际情况判断
      };

      // 创建安全的VM环境
      const vm = new VM({
        timeout: cloudFunction.timeout,
        sandbox: {
          console,
          JSON,
          Date,
          Math,
          parseInt,
          parseFloat,
          String,
          Number,
          Boolean,
          Array,
          Object,
          RegExp,
          Promise,
          setTimeout,
          clearTimeout,
          setInterval,
          clearInterval,
        },
      });

      // 包装函数代码
      const wrappedCode = `
        (async function(ctx) {
          ${cloudFunction.content}
          
          // 如果代码中有默认导出的handler函数
          if (typeof handler === 'function') {
            return await handler(ctx);
          }
          
          // 如果代码中有默认导出
          if (typeof module !== 'undefined' && module.exports && typeof module.exports.default === 'function') {
            return await module.exports.default(ctx);
          }
          
          // 如果代码中直接返回了结果
          if (typeof result !== 'undefined') {
            return result;
          }
          
          return null;
        })
      `;

      const func = vm.run(wrappedCode);
      const result = await func(context);

      return result;
    } catch (error) {
      this.logger.error(`云函数执行错误: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`云函数执行失败: ${error.message}`);
    }
  }

  /**
   * 验证函数代码
   */
  private validateFunctionCode(code: string): void {
    // 基本的代码安全检查
    const dangerousPatterns = [
      /require\s*\(/,
      /import\s+.*\s+from/,
      /process\./,
      /global\./,
      /eval\s*\(/,
      /Function\s*\(/,
      /child_process/,
      /fs\./,
      /path\./,
      /os\./,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new BadRequestException(`代码包含不安全的操作: ${pattern.source}`);
      }
    }
  }

  /**
   * 更新调用统计
   */
  private async updateCallStats(id: number): Promise<void> {
    await this.cloudFunctionRepository.increment(
      { id },
      'callCount',
      1,
    );
    await this.cloudFunctionRepository.update(id, {
      lastCalledAt: new Date(),
    });
  }

  /**
   * 创建日志
   */
  private async createLog(logData: Partial<CloudFunctionLog>): Promise<void> {
    try {
      const log = this.logRepository.create(logData);
      await this.logRepository.save(log);
    } catch (error) {
      this.logger.error('创建云函数日志失败', error);
    }
  }

  /**
   * 检查是否可以修改
   */
  private canModify(cloudFunction: CloudFunction, user: User): boolean {
    // 作者可以修改
    if (cloudFunction.authorId === user.id) {
      return true;
    }

    // 管理员可以修改
    return this.isAdmin(user);
  }

  /**
   * 检查是否为管理员
   */
  private isAdmin(user: User): boolean {
    return user.roles?.some(role => 
      role.permissions?.some(permission => 
        permission.action === PermissionAction.MANAGE && permission.resource === PermissionResource.CLOUD_FUNCTION
      )
    ) || false;
  }

  // 密钥管理相关方法

  /**
   * 创建密钥
   */
  async createSecret(
    cloudFunctionId: number,
    createDto: CreateCloudFunctionSecretDto,
    user: User,
  ): Promise<CloudFunctionSecret> {
    const cloudFunction = await this.findOne(cloudFunctionId);

    if (!this.canModify(cloudFunction, user)) {
      throw new ForbiddenException('没有权限管理此云函数的密钥');
    }

    // 检查密钥名称是否已存在
    const existingSecret = await this.secretRepository.findOne({
      where: {
        cloudFunctionId,
        key: createDto.key,
      },
    });

    if (existingSecret) {
      throw new BadRequestException('密钥名称已存在');
    }

    const secret = this.secretRepository.create({
      ...createDto,
      cloudFunctionId,
    });

    return await this.secretRepository.save(secret);
  }

  /**
   * 更新密钥
   */
  async updateSecret(
    secretId: number,
    updateDto: UpdateCloudFunctionSecretDto,
    user: User,
  ): Promise<CloudFunctionSecret> {
    const secret = await this.secretRepository.findOne({
      where: { id: secretId },
      relations: ['cloudFunction'],
    });

    if (!secret) {
      throw new NotFoundException('密钥不存在');
    }

    if (!this.canModify(secret.cloudFunction, user)) {
      throw new ForbiddenException('没有权限管理此密钥');
    }

    Object.assign(secret, updateDto);
    return await this.secretRepository.save(secret);
  }

  /**
   * 删除密钥
   */
  async removeSecret(secretId: number, user: User): Promise<void> {
    const secret = await this.secretRepository.findOne({
      where: { id: secretId },
      relations: ['cloudFunction'],
    });

    if (!secret) {
      throw new NotFoundException('密钥不存在');
    }

    if (!this.canModify(secret.cloudFunction, user)) {
      throw new ForbiddenException('没有权限管理此密钥');
    }

    await this.secretRepository.remove(secret);
  }

  /**
   * 获取云函数日志
   */
  async getLogs(
    cloudFunctionId: number,
    page = 1,
    limit = 50,
  ): Promise<PaginationResult<CloudFunctionLog>> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.logRepository.findAndCount({
      where: { cloudFunctionId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  /**
   * 清理日志
   */
  async clearLogs(cloudFunctionId: number, user: User): Promise<void> {
    const cloudFunction = await this.findOne(cloudFunctionId);

    if (!this.canModify(cloudFunction, user)) {
      throw new ForbiddenException('没有权限清理此云函数的日志');
    }

    await this.logRepository.delete({ cloudFunctionId });
  }
}
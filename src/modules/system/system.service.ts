import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting, SettingType } from './entities/system-setting.entity';

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
  ) {}

  /**
   * 检查博客是否已初始化
   */
  async isBlogInitialized(): Promise<boolean> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key: 'blog_initialized' },
    });

    return setting ? setting.getParsedValue() : false;
  }

  /**
   * 标记博客为已初始化
   */
  async markBlogAsInitialized(): Promise<void> {
    // 先查找现有记录
    let setting = await this.systemSettingRepository.findOne({
      where: { key: 'blog_initialized' },
    });

    if (setting) {
      // 如果记录存在，只更新值
      setting.setValue(true);
      await this.systemSettingRepository.save(setting);
    } else {
      // 如果记录不存在，创建新记录
      setting = this.systemSettingRepository.create({
        key: 'blog_initialized',
        value: 'true',
        type: SettingType.BOOLEAN,
        description: '博客是否已完成初始化',
        isSystem: true,
      });
      await this.systemSettingRepository.save(setting);
    }
  }

  /**
   * 获取系统设置
   */
  async getSetting(key: string): Promise<any> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    return setting ? setting.getParsedValue() : null;
  }

  /**
   * 设置系统配置
   */
  async setSetting(
    key: string,
    value: any,
    type: SettingType = SettingType.STRING,
    description?: string,
    isSystem: boolean = false,
  ): Promise<void> {
    // 查找现有设置
    let setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      // 创建新设置
      setting = this.systemSettingRepository.create({
        key,
        type,
        description,
        isSystem,
      });
      setting.setValue(value);
    } else {
      // 更新现有设置
      setting.setValue(value);
      if (description) {
        setting.description = description;
      }
    }

    await this.systemSettingRepository.save(setting);
  }

  /**
   * 获取所有系统设置
   */
  async getAllSettings(): Promise<SystemSetting[]> {
    return this.systemSettingRepository.find({
      order: { key: 'ASC' },
    });
  }

  /**
   * 删除系统设置
   */
  async deleteSetting(key: string): Promise<void> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (setting && !setting.isSystem) {
      await this.systemSettingRepository.remove(setting);
    }
  }

  /**
   * 初始化默认系统设置
   */
  async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        key: 'site_title',
        value: '我的博客',
        type: SettingType.STRING,
        description: '网站标题',
        isSystem: false,
      },
      {
        key: 'site_description',
        value: '一个基于 NestJS 的现代化博客系统',
        type: SettingType.STRING,
        description: '网站描述',
        isSystem: false,
      },
      {
        key: 'allow_registration',
        value: true,
        type: SettingType.BOOLEAN,
        description: '是否允许用户注册',
        isSystem: false,
      },
      {
        key: 'require_invite_code',
        value: false,
        type: SettingType.BOOLEAN,
        description: '注册是否需要邀请码',
        isSystem: false,
      },
    ];

    // 批量检查现有设置
    const existingKeys = await this.systemSettingRepository
      .createQueryBuilder('setting')
      .select('setting.key')
      .where('setting.key IN (:...keys)', { 
        keys: defaultSettings.map(s => s.key) 
      })
      .getMany();
    
    const existingKeySet = new Set(existingKeys.map(s => s.key));

    // 只创建不存在的设置
    const newSettings = defaultSettings
      .filter(settingData => !existingKeySet.has(settingData.key))
      .map(settingData => {
        const setting = this.systemSettingRepository.create({
          key: settingData.key,
          type: settingData.type,
          description: settingData.description,
          isSystem: settingData.isSystem,
        });
        setting.setValue(settingData.value);
        return setting;
      });

    if (newSettings.length > 0) {
      await this.systemSettingRepository.save(newSettings);
    }
  }
}
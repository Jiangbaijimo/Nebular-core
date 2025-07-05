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
    let setting = await this.systemSettingRepository.findOne({
      where: { key: 'blog_initialized' },
    });

    if (!setting) {
      setting = this.systemSettingRepository.create({
        key: 'blog_initialized',
        value: 'true',
        type: SettingType.BOOLEAN,
        description: '博客是否已完成初始化',
        isSystem: true,
      });
    } else {
      setting.setValue(true);
    }

    await this.systemSettingRepository.save(setting);
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
    let setting = await this.systemSettingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      setting = this.systemSettingRepository.create({
        key,
        type,
        description,
        isSystem,
      });
    }

    setting.setValue(value);
    if (description) {
      setting.description = description;
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
        key: 'blog_initialized',
        value: false,
        type: SettingType.BOOLEAN,
        description: '博客是否已完成初始化',
        isSystem: true,
      },
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

    for (const settingData of defaultSettings) {
      const existing = await this.systemSettingRepository.findOne({
        where: { key: settingData.key },
      });

      if (!existing) {
        const setting = this.systemSettingRepository.create({
          key: settingData.key,
          type: settingData.type,
          description: settingData.description,
          isSystem: settingData.isSystem,
        });
        setting.setValue(settingData.value);
        await this.systemSettingRepository.save(setting);
      }
    }
  }
}
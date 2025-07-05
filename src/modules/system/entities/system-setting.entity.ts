import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({
    type: 'enum',
    enum: SettingType,
    default: SettingType.STRING,
  })
  type: SettingType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isSystem: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 获取解析后的值
  getParsedValue(): any {
    switch (this.type) {
      case SettingType.BOOLEAN:
        return this.value === 'true';
      case SettingType.NUMBER:
        return parseFloat(this.value);
      case SettingType.JSON:
        try {
          return JSON.parse(this.value);
        } catch {
          return null;
        }
      default:
        return this.value;
    }
  }

  // 设置值
  setValue(value: any): void {
    switch (this.type) {
      case SettingType.BOOLEAN:
        this.value = Boolean(value).toString();
        break;
      case SettingType.NUMBER:
        this.value = Number(value).toString();
        break;
      case SettingType.JSON:
        this.value = JSON.stringify(value);
        break;
      default:
        this.value = String(value);
    }
  }
}
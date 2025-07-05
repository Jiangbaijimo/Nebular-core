import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('invite_codes')
export class InviteCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 32 })
  code: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @Column({ nullable: true })
  usedByUserId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usedByUserId' })
  usedBy: User;

  @Column()
  createdByUserId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
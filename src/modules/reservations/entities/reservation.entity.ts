import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import { Resource } from '../../resources/entities/resource.entity';
import { User } from '../../users/entities/user.entity';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

@Entity('reservations')
@Index(['resourceId', 'startTime', 'endTime'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'resource_id' })
  resourceId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime!: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;

  @Column({
    type: 'tstzrange',
    name: 'period',
    nullable: true,
    insert: false,
    update: false,
    select: true,
  })
  period!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Resource, (resource) => resource.reservations)
  @JoinColumn({ name: 'resource_id' })
  resource!: Resource;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @BeforeInsert()
  @BeforeUpdate()
  validateTimeRange() {
    if (this.startTime >= this.endTime) {
      throw new Error('Start time must be before end time');
    }
  }
}

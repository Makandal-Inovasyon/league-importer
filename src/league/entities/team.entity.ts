import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Player } from './player.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UploadState {
  PENDING,
  FAILED,
  UPLOADING,
  DONE,
}

@Entity('competition')
@ObjectType()
export class Competition {
  @PrimaryColumn()
  id: number;

  @Column()
  @Field({ nullable: false })
  name: string;

  @Column()
  @Field({ nullable: false })
  code: string;

  @Column()
  @Field({ nullable: false })
  areaName: string;

  @Column({
    type: 'enum',
    enum: UploadState,
    default: UploadState.PENDING,
  })
  status: UploadState;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('team')
@ObjectType()
export class Team {
  @PrimaryColumn()
  id: number;

  @Column()
  @Field({ nullable: false })
  name: string;

  @Column()
  @Field({ nullable: false })
  tla: string;

  @Column()
  @Field({ nullable: false })
  shortName: string;

  @Column()
  @Field({ nullable: false })
  areaName: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  address: string;

  @OneToMany(() => Player, (player) => player.team)
  @Field((type) => [Player])
  players: Player[];

  @Column('text', { array: true, default: '{}' })
  leagueCode: string[];

  @UpdateDateColumn()
  updatedAt: Date;
}

@ObjectType()
export class UploadStatus {
  @Field({ nullable: false })
  status: string;

  @Field({ nullable: false })
  leagueCode: string;
}

import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Team } from './team.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('player')
@ObjectType()
export class Player {
  @PrimaryColumn()
  id: number;

  @Column('text', { array: true, default: '{}' })
  leagueCode: string[];

  @Column()
  @Field({ nullable: false })
  name: string;

  @Column()
  @Field({ nullable: false })
  position: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  dateOfBirth?: string;

  @Column()
  @Field({ nullable: false })
  nationality: string;

  @ManyToOne(() => Team, (team) => team.players)
  @Field((type) => Team)
  team: Team;
}

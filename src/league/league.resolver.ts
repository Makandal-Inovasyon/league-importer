import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
  Subscription,
} from '@nestjs/graphql';
import { LeagueService } from './league.service';
import { UploadStatus, Team, Competition } from './entities/team.entity';
import { Player } from './entities/player.entity';
import { PubSub } from 'graphql-subscriptions';
import { Inject } from '@nestjs/common';
import { LoggerService } from 'src/logger.service';

@Resolver(() => Team)
export class LeagueResolver {
  private LOG_PREFIX = LeagueResolver.name;
  constructor(
    private readonly leagueService: LeagueService,
    @Inject('PUB_SUB') private pubSub: PubSub,
    private logger: LoggerService,
  ) {}

  @Mutation(() => UploadStatus)
  async importLeague(@Args('leagueCode') leagueCode: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [importLeague] leagueCode: ${leagueCode}`,
    );
    const result = await this.leagueService.importCompetition(leagueCode);
    this.pubSub.publish('UploadStatus', { UploadStatus: result });
    return result;
  }

  @Query(() => Competition, { name: 'competition' })
  findCompetition(@Args('leagueCode') leagueCode: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findCompetition] leagueCode: ${leagueCode}`,
    );
    return this.leagueService.findCompetition(leagueCode);
  }

  @Query(() => [Team], { name: 'teams' })
  findTeams(@Args('leagueCode') leagueCode: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findTeams] leagueCode: ${leagueCode}`,
    );
    return this.leagueService.findTeam(leagueCode);
  }

  @Query(() => Team, { name: 'team' })
  findTeam(@Args('name') name: string) {
    this.logger.log(`${this.LOG_PREFIX} - [findTeam] name: ${name}`);
    return this.leagueService.findTeamByName(name);
  }

  @Query(() => [Player], { name: 'players' })
  findPlayers(
    @Args('leagueCode') leagueCode: string,
    @Args({ name: 'teamName', type: () => String, nullable: true })
    teamName?: string,
  ) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findPlayers] leagueCode: ${leagueCode}, teamName: ${teamName}`,
    );
    return this.leagueService.findPlayers(leagueCode, teamName);
  }

  @ResolveField()
  players(@Parent() team: Team) {
    const { id } = team;
    return team.players;
  }

  @ResolveField()
  teams(@Parent() player: Player): Team {
    return player.team;
  }

  @Subscription((returns) => UploadStatus)
  UploadStatus() {
    return this.pubSub.asyncIterator(['UploadStatus']);
  }
}

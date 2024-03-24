import { Injectable } from '@nestjs/common';
import { Team, UploadState, UploadStatus } from './entities/team.entity';
import { SqsService } from '@ssut/nestjs-sqs';
import { ConfigService } from '@nestjs/config';
import { TeamService } from './team.service';
import { CompetitionService } from './competition.service';
import { PlayerService } from './players.service';
import { Player } from './entities/player.entity';
import { v4 as uuidv4 } from 'uuid';
import { ErrorResponse } from './errors/error';
import { LoggerService } from 'src/logger.service';

@Injectable()
export class LeagueService {
  private LOG_PREFIX = LeagueService.name;
  private queueName: string;
  constructor(
    private teamService: TeamService,
    private playerService: PlayerService,
    private competitionService: CompetitionService,
    private readonly sqsService: SqsService,
    private readonly configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.queueName = this.configService.get('aws.sqs.name');
  }

  async importCompetition(leagueCode: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [importCompetition] leagueCode: ${leagueCode}`,
    );
    const status = new UploadStatus();
    status.status = UploadState[UploadState.PENDING];
    status.leagueCode = leagueCode;
    const message = {
      id: uuidv4(),
      body: { leagueCode },
    };
    const competition =
      await this.competitionService.findCompetition(leagueCode);
    if (competition) {
      let now = Date.now();
      // To not update the competition more than twice in 24hrs
      const diff =
        (now - competition.updatedAt.valueOf()) / (24 * 60 * 60 * 1000);
      if (diff < 1) {
        status.status = UploadState[competition.status];
        this.logger.log(
          `${this.LOG_PREFIX} - [importCompetition] leagueCode: ${leagueCode} already imported and up to date.`,
        );
        return status;
      }
    }
    await this.sqsService.send(this.queueName, message);
    return status;
  }

  async findTeam(leagueCode: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findTeam] leagueCode: ${leagueCode}`,
    );
    const result = await this.teamService.find(leagueCode);
    if (!result) throw new ErrorResponse('Team not found');
    return result;
  }

  async findTeamByName(name: string) {
    this.logger.log(`${this.LOG_PREFIX} - [findTeamByName] name: ${name}`);
    const result = await this.teamService.findOneByName(name);
    if (!result) throw new ErrorResponse('Team not found');
    return result;
  }

  async findCompetition(leagueCode: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findCompetition] leagueCode: ${leagueCode}`,
    );
    const result = await this.competitionService.findCompetition(leagueCode);
    if (!result) throw new ErrorResponse('Competition not found');
    return result;
  }

  async findTeamByPlayer(player: Player) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findTeamByPlayer] playerId: ${player.id}`,
    );
    return this.teamService.findTeamByPlayerId(player.id);
  }

  async findPlayerByTeam(team: Team) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findPlayerByTeam] teamId: ${team.id}`,
    );
    return this.playerService.findPlayersByTeamId(team.id);
  }

  async findPlayers(leagueCode: string, teamName?: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findPlayers] leagueCode: ${leagueCode}, teamName: ${teamName}`,
    );
    const result = await this.playerService.findPlayersByLeagueCode(
      leagueCode,
      teamName,
    );
    if (!result || !result.length) throw new ErrorResponse('No Players found');
    return result;
  }
}

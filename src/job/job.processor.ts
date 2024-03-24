import { Inject, Injectable } from '@nestjs/common';
import { SqsConsumerEventHandler, SqsMessageHandler } from '@ssut/nestjs-sqs';
//import * as AWS from '@aws-sdk';
import { SQSClient, Message, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import configurations from 'config/configurations';
import { ConfigService } from '@nestjs/config';
import { RateLimiterService } from './rateLimiter.service';
import { LeagueApiClientService } from './leagueApiClient';
import { CompetitionService } from 'src/league/competition.service';
import { TeamService } from 'src/league/team.service';
import { PlayerDTO, TeamDTO } from './dto/team.dto';
import {
  Competition,
  Team,
  UploadState,
  UploadStatus,
} from 'src/league/entities/team.entity';
import { Player } from 'src/league/entities/player.entity';
import { PlayerService } from 'src/league/players.service';
import { CompetitionDTO } from './dto/competition.dto';
import { PubSub } from 'graphql-subscriptions';
import { LoggerService } from 'src/logger.service';

const queue = configurations().aws.sqs.name;
@Injectable()
export class JobProcessor {
  private LOG_PREFIX = JobProcessor.name;
  constructor(
    @Inject('PUB_SUB') private pubSub: PubSub,
    private readonly configService: ConfigService,
    private rateLimiter: RateLimiterService,
    private leagueApi: LeagueApiClientService,
    private competitionService: CompetitionService,
    private teamService: TeamService,
    private playerService: PlayerService,
    private logger: LoggerService,
  ) {}

  @SqsMessageHandler(queue, false)
  async handleMessage(message: Message) {
    this.logger.log(`${this.LOG_PREFIX} - [handleMessage] message received`, {
      message,
    });
    const DoNoAcknowledge = {};
    try {
      const { leagueCode } = JSON.parse(message.Body);

      this.logger.log(
        `${this.LOG_PREFIX} - [handleMessage] leagueCode received: ${leagueCode}`,
      );

      const canHit = await this.rateLimiter.checkLimit();
      if (canHit) {
        let data = await this.leagueApi.getCompetitions(leagueCode);
        this.logger.log(
          `${this.LOG_PREFIX} - [handleMessage] competition retrieved: ${data.name}`,
        );
        const competition = await this.competitionService.createOrUpdate(
          this.mapCompetitionFromDTO(data),
        );
        this.logger.log(
          `${this.LOG_PREFIX} - [handleMessage] competitionId saved: ${competition.id}`,
        );
        let { teams: teamsDTO } = await this.leagueApi.getTeamsByCompetition(
          competition.id,
        );
        this.logger.log(
          `${this.LOG_PREFIX} - [handleMessage] teams retrieved - count: ${teamsDTO.length}`,
        );
        let { teams, players } = this.mapTeamsAndPlayers(teamsDTO);
        await this.teamService.upsertTeams(teams);
        this.logger.log(`${this.LOG_PREFIX} - [handleMessage] teams saved`);
        await this.playerService.upsertPlayers(players);
        this.logger.log(`${this.LOG_PREFIX} - [handleMessage] players saved`);
        await this.competitionService.updateStatus(
          competition.id,
          UploadState.DONE,
        );
        //await this.removeMessage(message.ReceiptHandle);
        const status = new UploadStatus();
        status.status = UploadState[UploadState.DONE];
        status.leagueCode = leagueCode;
        this.pubSub.publish('UploadStatus', { UploadStatus: status });
        this.logger.log(
          `${this.LOG_PREFIX} - [handleMessage] league import completed`,
        );
      } else {
        this.logger.log(
          `${this.LOG_PREFIX} - [handleMessage] token rate limit hit`,
        );
        return DoNoAcknowledge;
      }
    } catch (err) {
      this.logger.error(
        `${this.LOG_PREFIX} - [handleMessage] ERROR while handling message `,
        { message, err },
      );
      if (err.code == 'ERR_BAD_REQUEST') throw err;
    }
  }

  mapTeamsAndPlayers(teamsDTO: TeamDTO[]) {
    let players = [];
    let teams = teamsDTO.map((teamDTO) => {
      let team = this.mapTeamFromDTO(teamDTO);
      if (teamDTO.squad)
        players = players.concat(this.mapPlayerFromDTO(teamDTO.squad, team));
      return team;
    });
    return { players, teams };
  }

  mapTeamFromDTO(teamDTO: TeamDTO): Team {
    const team = new Team();
    team.id = teamDTO.id;
    team.address = teamDTO.address;
    team.areaName = teamDTO.area.name;
    team.name = teamDTO.name;
    team.shortName = teamDTO.shortName;
    team.tla = teamDTO.tla;
    team.leagueCode = teamDTO.runningCompetitions.map((comp) => comp.code);
    team.updatedAt = new Date();
    return team;
  }

  mapPlayerFromDTO(playersDTO: PlayerDTO[], team: Team) {
    return playersDTO.map((playerDTO) => {
      let player = new Player();
      player.id = playerDTO.id;
      player.name = playerDTO.name;
      player.dateOfBirth = playerDTO.dateOfBirth;
      player.nationality = playerDTO.nationality;
      player.position = playerDTO.position;
      player.leagueCode = team.leagueCode;
      player.team = team;
      return player;
    });
  }

  mapCompetitionFromDTO(competitionDTO: CompetitionDTO) {
    this.logger.log(`${this.LOG_PREFIX} - [mapCompetitionFromDTO] `);
    const competition = new Competition();
    competition.id = competitionDTO.id;
    competition.areaName = competitionDTO.area.name;
    competition.code = competitionDTO.code;
    competition.name = competitionDTO.name;
    competition.updatedAt = new Date();
    competition.status = UploadState.UPLOADING;
    return competition;
  }

  @SqsConsumerEventHandler(queue, 'processing_error')
  public async onProcessingError(error: any, message: Message) {
    this.logger.log(`${this.LOG_PREFIX} - [onProcessingError] `, {
      message,
      error,
    });
    try {
      const { leagueCode } = JSON.parse(message.Body);
      const competition =
        await this.competitionService.findCompetition(leagueCode);
      if (competition) {
        await this.competitionService.updateStatus(
          competition.id,
          UploadState.FAILED,
        );
      }
      await this.removeMessage(message.ReceiptHandle);
    } catch (error) {
      // log this error
      this.logger.error(
        `${this.LOG_PREFIX} - [onProcessingError] An error occured while handling the error `,
        { message, error },
      );
    }
  }

  async removeMessage(receiptHandle: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [removeMessage] - receiptHandle: ${receiptHandle}`,
    );
    const client = new SQSClient({
      /* credentials: {
          accessKeyId: this.configService.get('aws.accessKeyId'),
          secretAccessKey: this.configService.get('aws.secretAccessKey'),
        }, */
      region: this.configService.get('aws.region'),
    });
    const input = {
      // DeleteMessageRequest
      QueueUrl: this.configService.get('aws.sqs.queueUrl'), // required
      ReceiptHandle: receiptHandle, // required
    };
    const command = new DeleteMessageCommand(input);
    await client.send(command);
  }
}

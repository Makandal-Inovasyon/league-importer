import { Injectable } from '@nestjs/common';
import { Team } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { LoggerService } from 'src/logger.service';

@Injectable()
export class TeamService {
  private LOG_PREFIX = TeamService.name;
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    private logger: LoggerService,
  ) {}

  async upsertTeams(teams: Team[]) {
    this.logger.log(
      `${this.LOG_PREFIX} - [upsertTeams] teams count: ${teams.length}`,
    );
    const result = await this.teamRepository.upsert(teams, ['id']);
    return result;
  }

  async find(leagueCode: string) {
    this.logger.log(`${this.LOG_PREFIX} - [find] leagueCode: ${leagueCode}`);
    const teams = await this.teamRepository.find({
      where: {
        leagueCode: ArrayContains([leagueCode]),
      },
      relations: {
        players: true,
      },
    });
    return teams;
  }

  async findOneByName(name: string) {
    this.logger.log(`${this.LOG_PREFIX} - [findOneByName] name: ${name}`);
    const team = await this.teamRepository.findOne({
      where: {
        name: name,
      },
      relations: {
        players: true,
      },
    });
    return team;
  }

  async findTeamByPlayerId(id: number) {
    this.logger.log(`${this.LOG_PREFIX} - [findTeamByPlayerId] id: ${id}`);
    const team = await this.teamRepository.findOne({
      where: {
        players: {
          id,
        },
      },
      relations: {
        players: true,
      },
    });
    return team;
  }
}

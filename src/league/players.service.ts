import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { LoggerService } from 'src/logger.service';

@Injectable()
export class PlayerService {
  private LOG_PREFIX = PlayerService.name;
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    private logger: LoggerService,
  ) {}

  upsertPlayers(players: Player[]) {
    this.logger.log(
      `${this.LOG_PREFIX} - [upsertPlayers] players count: ${players.length}`,
    );
    return this.playerRepository.upsert(players, ['id']);
  }

  async findPlayersByTeamId(id: number) {
    this.logger.log(`${this.LOG_PREFIX} - [findPlayersByTeamId] id: ${id}`);
    const players = await this.playerRepository.find({
      where: {
        team: {
          id,
        },
      },
      relations: {
        team: true,
      },
    });
    return players;
  }

  async findPlayersByLeagueCode(leagueCode: string, teamName?: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [findPlayersByLeagueCode] leagueCode: ${leagueCode} teamName: ${teamName} `,
    );
    const players = await this.playerRepository.find({
      relations: {
        team: true,
      },
      where: {
        leagueCode: ArrayContains([leagueCode]),
        team: {
          name: teamName,
        },
      },
    });
    return players;
  }
}

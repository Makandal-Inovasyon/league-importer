import { Injectable } from '@nestjs/common';
import { Competition, UploadState } from './entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from 'src/logger.service';

@Injectable()
export class CompetitionService {
  private LOG_PREFIX = CompetitionService.name;
  constructor(
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
    private logger: LoggerService,
  ) {}

  async createOrUpdate(competition: Competition) {
    this.logger.log(
      `${this.LOG_PREFIX} - [createOrUpdate] competitionId: ${competition.id}`,
    );
    const result = await this.competitionRepository.upsert(
      [competition],
      ['id'],
    );
    return result.identifiers[0] as Competition;
  }

  async updateStatus(id: number, status: UploadState) {
    this.logger.log(
      `${this.LOG_PREFIX} - [updateStatus] id: ${id} status: ${status}`,
    );
    return this.competitionRepository.update(id, {
      status,
    });
  }

  async findCompetition(leagueCode: string): Promise<Competition> {
    this.logger.log(
      `${this.LOG_PREFIX} - [findCompetition] leagueCode: ${leagueCode}`,
    );
    const competition = await this.competitionRepository.findOneBy({
      code: leagueCode,
    });
    return competition;
  }
}

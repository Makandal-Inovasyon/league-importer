import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { LoggerService } from 'src/logger.service';

@Injectable()
export class LeagueApiClientService {
  private LOG_PREFIX = LeagueApiClientService.name;
  private baseUrl: string;
  private token: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.baseUrl = this.configService.get('footballApi.baseUrl');
    this.token = this.configService.get('token.value');
  }

  async getCompetitions(leagueCode: string) {
    this.logger.log(
      `${this.LOG_PREFIX} - [getCompetitions] leagueCode: ${leagueCode}`,
    );
    const { data } = await firstValueFrom(
      this.httpService
        .get(`${this.baseUrl}/competitions/${leagueCode}`, {
          headers: {
            'X-Auth-Token': this.token,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `${this.LOG_PREFIX} - [getCompetitions] Error while retrieving competitions`,
              { error },
            );
            throw error;
          }),
        ),
    );
    return data;
  }

  async getTeamsByCompetition(competitionId: number) {
    this.logger.log(
      `${this.LOG_PREFIX} - [getTeamsByCompetition] competitionId: ${competitionId}`,
    );
    const { data } = await firstValueFrom(
      this.httpService
        .get(`${this.baseUrl}/competitions/${competitionId}/teams`, {
          headers: {
            'X-Auth-Token': this.token,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(
              `${this.LOG_PREFIX} - [getTeamsByCompetition] Error while retrieving teams`,
              { error },
            );
            throw error;
          }),
        ),
    );
    return data;
  }
}

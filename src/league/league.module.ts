import { Module, forwardRef } from '@nestjs/common';
import { LeagueService } from './league.service';
import { LeagueResolver } from './league.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competition, Team } from './entities/team.entity';
import * as AWS from 'aws-sdk';
import configurations from 'config/configurations';
import { SqsModule } from '@ssut/nestjs-sqs';
import { TeamService } from './team.service';
import { CompetitionService } from './competition.service';
import { PlayerService } from './players.service';
import { Player } from './entities/player.entity';
import { PubSub } from 'graphql-subscriptions';
import { LoggerService } from 'src/logger.service';

AWS.config.update({
  region: configurations().aws.region, // aws region
  accessKeyId: configurations().aws.accessKeyId, // aws access key id
  secretAccessKey: configurations().aws.secretAccessKey, // aws secret access key
});

@Module({
  imports: [
    TypeOrmModule.forFeature([Competition, Team, Player]),
    SqsModule.register({
      consumers: [],
      producers: [
        {
          name: configurations().aws.sqs.name,
          queueUrl: configurations().aws.sqs.queueUrl,
          region: configurations().aws.region,
        },
      ],
    }),
  ],
  exports: [
    LeagueResolver,
    CompetitionService,
    TeamService,
    PlayerService,
    'PUB_SUB',
    LoggerService,
  ],
  providers: [
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
    LeagueResolver,
    CompetitionService,
    TeamService,
    PlayerService,
    LeagueService,
    LoggerService,
  ],
})
export class LeagueModule {}

import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import * as AWS from 'aws-sdk';
import { JobProcessor } from './job.processor';
import configurations from 'config/configurations';
import { RateLimiterService } from './rateLimiter.service';
import { HttpModule } from '@nestjs/axios';
import { LeagueApiClientService } from './leagueApiClient';
import { LeagueModule } from 'src/league/league.module';

AWS.config.update({
  region: configurations().aws.region, // aws region
  accessKeyId: configurations().aws.accessKeyId, // aws access key id
  secretAccessKey: configurations().aws.secretAccessKey, // aws secret access key
});
@Module({
  imports: [
    SqsModule.register({
      consumers: [
        {
          name: configurations().aws.sqs.name,
          queueUrl: configurations().aws.sqs.queueUrl,
          region: configurations().aws.region,
        },
      ],
      producers: [],
    }),
    HttpModule,
    LeagueModule,
  ],
  controllers: [],
  providers: [JobProcessor, LeagueApiClientService, RateLimiterService],
})
export class ProcessorModule {}

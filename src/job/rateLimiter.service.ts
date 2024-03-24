import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisStore, SlideLimiter } from 'slide-limiter';
import { LoggerService } from 'src/logger.service';

@Injectable()
export class RateLimiterService {
  private LOG_PREFIX = RateLimiterService.name;
  private limiter: SlideLimiter;
  private token: string;
  constructor(
    private readonly configService: ConfigService,
    private logger: LoggerService,
  ) {
    // Create a RedisStore instance
    const store = new RedisStore(
      new Redis({
        host: this.configService.get('redis.host'),
        port: this.configService.get('redis.port'),
        password: this.configService.get('redis.password'),
      }),
    );

    this.token = this.configService.get('token.value');
    const options = {
      windowMs: this.configService.get('token.rateWindow'), // 1 minute
      // I add the (+1) here beacause it is better and much simpler than to remember to add it in the configuration
      maxLimit: +this.configService.get('token.maxLimit') + 1, // n = 6 + 1
    };
    this.limiter = new SlideLimiter(store, options);
  }

  async checkLimit() {
    this.logger.log(`${this.LOG_PREFIX} - [checkLimit] `);
    const remaining = await this.limiter.hit('league', this.token);
    this.logger.log(
      `${this.LOG_PREFIX} - [checkLimit] hits remaining: ${remaining}`,
    );
    return remaining > 0;
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { LeagueService } from './league.service';

describe('TeamService', () => {
  let service: LeagueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeagueService],
    }).compile();

    service = module.get<LeagueService>(LeagueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

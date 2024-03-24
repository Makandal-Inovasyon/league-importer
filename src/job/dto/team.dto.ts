import { AreaDTO } from './competition.dto';

export class TeamDTO {
  id: number;
  area: AreaDTO;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address: string;
  website: string;
  founded: number;
  clubColors: string;
  venue: string;
  runningCompetitions: any;
  staff: any;
  lastUpdated: Date;
  squad: PlayerDTO[];
}

export class PlayerDTO {
  id: number;
  name: string;
  position: string;
  dateOfBirth: string;
  nationality: string;
}

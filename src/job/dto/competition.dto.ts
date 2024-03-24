export class CompetitionDTO {
  id: number;
  area: AreaDTO;
  name: string;
  code: string;
  type: string;
  emblem: string;
  currentSeason: any;
  seasons: any[];
  lastUpdated: Date;
}

export class AreaDTO {
  id: number;
  name: string;
  code: string;
  flag: string;
}

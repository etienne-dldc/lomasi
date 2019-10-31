import { Mailer } from './Mailer';

export interface AppConfig {
  domain: string;
  jwtTokenSecret: string;
  usersWhiteList?: Array<string> | null;
  usersBlackList?: Array<string> | null;
}

export interface UserOptions {
  mailer: Mailer;
  apps: Array<AppConfig>;
  skipOriginCheck?: boolean;
}

export type Options = Required<UserOptions>;

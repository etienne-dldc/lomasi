import { Mailer } from './Mailer';

export interface AppConfig {
  origin: string;
  jwtMailSecret: string;
  jwtAuthSecret: string;
  jwtMailExpireIn?: string | number;
  jwtAuthExpireIn?: string | number;
  usersWhiteList?: Array<string> | null;
  usersBlackList?: Array<string> | null;
  allowedOrigin?: Array<string> | null;
}

export type AppConfigResolved = Required<AppConfig>;

export interface UserOptions {
  mailer: Mailer;
  apps: Array<AppConfig>;
  skipOriginCheck?: boolean;
}

export type Options = Omit<Required<UserOptions>, 'apps'> & { apps: Array<AppConfigResolved> };

export const APP_CONFIG_DEFAULTS: AppConfigResolved = {
  origin: '',
  jwtAuthSecret: '',
  jwtMailSecret: '',
  jwtAuthExpireIn: '10m',
  jwtMailExpireIn: '7d',
  allowedOrigin: null,
  usersBlackList: null,
  usersWhiteList: null,
};

const DEFAULT_MAILER: Mailer = {
  sendMail: async () => {
    console.warn('Missing Mailer');
  },
};

export const OPTIONS_DEFAULTS: Options = {
  skipOriginCheck: false,
  apps: [],
  mailer: DEFAULT_MAILER,
};

import { Mailer } from './Mailer';
import { seconds } from './utils';

export interface AppConfig {
  origin: string;
  jwtSecret: string;
  // How many time can the token be renewed without sending a mail
  maxRenew?: number;
  // What is the max expire delay for token to be used to renew
  // in seconds or ms string
  maxRenewDelay?: number | string;
  // in seconds or ms string
  tokenExpireIn?: string | number;
  usersWhiteList?: Array<string> | null;
  usersBlackList?: Array<string> | null;
  allowedOrigin?: Array<string> | null;
}

export type AppConfigResolved = Omit<Required<AppConfig>, 'maxRenewDelay'> & {
  maxRenewDelay: number;
};

export interface UserOptions {
  mailer: Mailer;
  apps: Array<AppConfig>;
  skipOriginCheck?: boolean;
}

export type Options = Omit<Required<UserOptions>, 'apps'> & { apps: Array<AppConfigResolved> };

export const APP_CONFIG_DEFAULTS: AppConfigResolved = {
  origin: '',
  jwtSecret: '',
  allowedOrigin: null,
  maxRenew: 30,
  maxRenewDelay: seconds('7d'),
  tokenExpireIn: '1h',
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

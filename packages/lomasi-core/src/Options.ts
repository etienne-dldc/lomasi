import { Mailer } from './Mailer';

export interface AppConfig {
  origin: string;
  refreshToken: {
    jwtSecret: string;
    jwtExpireIn?: string | number;
  };
  authToken?: {
    jwtSecret: string;
    jwtExpireIn?: string | number;
  } | null;
  isUserAllowed?: null | ((user: string) => boolean | Promise<boolean>);
  allowedOrigin?: Array<string> | null;
}

export type AppConfigResolved = Required<AppConfig>;

export interface UserOptions {
  mailer: Mailer;
  apps: Array<AppConfig>;
  skipOriginCheck?: boolean;
}

export type Options = Omit<Required<UserOptions>, 'apps'> & { apps: Array<AppConfigResolved> };

export const DEFAULT_REFRESH_TOKEN_EXPIRE_IN = '7d';
export const DEFAULT_AUTH_TOKEN_EXPIRE_IN = '7d';

export const APP_CONFIG_DEFAULTS: AppConfigResolved = {
  origin: '',
  refreshToken: {
    jwtSecret: '',
  },
  authToken: null,
  allowedOrigin: null,
  isUserAllowed: null,
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

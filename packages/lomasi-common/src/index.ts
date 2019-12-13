export interface LomasiTokenData {
  email: string;
  app: string;
}

export interface LomasiToken extends LomasiTokenData {
  iat: number;
  exp: number;
}

export interface LoginBody {
  email: string;
  password: string;
  callback: string;
}

type CommonResponse = { type: 'UnauthorizedOrigin'; message: string } | { type: 'InternalError'; message: string };

export type LoginResponse =
  | {
      type: 'MailSend';
      message: string;
    }
  | CommonResponse
  | CheckOriginError
  | CheckUserError;

export interface AuthenticateBody {
  token: string;
  password: string;
}

export type AuthenticateValidateCommon =
  | { type: 'InvalidTokenOrPassword' }
  | { type: 'TokenExpired' }
  | { type: 'AuthTokenNotConfigured' }
  | CommonResponse
  | CheckOriginError
  | CheckUserError;

export type AuthenticateResponse =
  | AuthenticateValidateCommon
  | {
      type: 'Authorized';
      token: string;
    };

export interface ValidateBody {
  token: string;
  password: string;
}

export type ValidateResponse =
  | AuthenticateValidateCommon
  | {
      type: 'Validated';
    };

export type CheckOriginError = { type: 'MissingOrigin' } | { type: 'InvalidOrigin' };

export type CheckUserError = {
  type: 'UnauthorizedUser';
};

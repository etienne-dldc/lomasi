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

export interface LoginResponse {
  message: string;
}

export interface AuthenticateBody {
  token: string;
  password: string;
}

export interface AuthenticateResponse {
  token: string;
}

export interface LomasiTokenData {
  email: string;
  app: string;
  renew: number;
}

export interface LomasiToken extends LomasiTokenData {
  iat: number;
  exp: number;
}

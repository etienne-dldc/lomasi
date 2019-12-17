import decodeJwt from 'jwt-decode';
import { LomasiToken } from '@lomasi/common';

const nowInSec = () => Date.now() / 1000;

export const Token = {
  decode,
  expired,
};

function decode(token: string): LomasiToken {
  console.log('decode', token);

  return decodeJwt<LomasiToken>(token);
}

function expired(token: string | LomasiToken, offset: number = 0): boolean {
  console.log('expired', token);

  const exp = (typeof token === 'string' ? decode(token).exp : token.exp) + offset;
  return exp <= nowInSec();
}

import decodeJwt from 'jwt-decode';
import { LomasiToken } from '@lomasi/common';

export const Token = {
  decode,
};

function decode(token: string): LomasiToken {
  return decodeJwt<LomasiToken>(token);
}

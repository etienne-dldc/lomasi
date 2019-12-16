import React from 'react';
import { AuthenticateResponse } from '@lomasi/common';
import { Token } from './Token';
import { useRenderAt } from './utils/useRenderAt';

type Request =
  | { type: 'VOID' }
  | { type: 'PENDING'; token: string; password: string }
  | { type: 'REJECTED'; token: string; password: string; error: string };

export type UseLomasiAuthTokenResult =
  | { type: 'VOID' }
  | { type: 'PENDING' }
  | { type: 'LOGGED_IN'; token: string }
  | { type: 'REJECTED'; error: string };

export interface UseLomasiAuthTokenOptions {
  refreshToken: string | null;
  password: string | null;
  getToken: (token: string, password: string) => Promise<AuthenticateResponse>;
}

const AUTO_RENEW_DELAY = 20;

export function useLomasiAuthToken(options: UseLomasiAuthTokenOptions): UseLomasiAuthTokenResult {
  const { password, refreshToken, getToken: doGetToken } = options;
  const [requestStatus, setRequestStatus] = React.useState<Request>({ type: 'VOID' });
  const [token, setToken] = React.useState<null | string>(null);

  const getToken = React.useCallback(
    async (token: string, password: string) => {
      if (refreshToken && password) {
        try {
          const res = await doGetToken(refreshToken, password);
          if (res.type === 'Authorized') {
            setToken(res.token);
            setRequestStatus({ type: 'VOID' });
            return;
          }
          setRequestStatus({
            type: 'REJECTED',
            token,
            password,
            error: res.type,
          });
          return;
        } catch (error) {
          setRequestStatus({
            type: 'REJECTED',
            token,
            password,
            error: error instanceof Error ? error.message : '',
          });
        }
      }
    },
    [doGetToken, refreshToken]
  );

  const tokenData = React.useMemo(() => (token ? { token: token, data: Token.decode(token) } : null), [token]);

  const expired = tokenData ? Token.expired(tokenData.data) : null;
  const willExpireSoon = tokenData ? Token.expired(tokenData.data, -AUTO_RENEW_DELAY) : null;

  const result = ((): UseLomasiAuthTokenResult => {
    if (!refreshToken || !password) {
      return { type: 'VOID' };
    }
    if (tokenData) {
      if (expired === false) {
        return { type: 'LOGGED_IN', token: tokenData.token };
      }
      // token is expired, prendent we don't have one.
    }
    if (requestStatus.type === 'PENDING') {
      return { type: 'PENDING' };
    }
    if (requestStatus.type === 'REJECTED') {
      return { type: 'REJECTED', error: requestStatus.error };
    }
    if (requestStatus.type === 'VOID') {
      return { type: 'VOID' };
    }
    return { type: 'VOID' };
  })();

  // Reset request when password change
  React.useEffect(() => {
    setRequestStatus({ type: 'VOID' });
  }, [password]);

  React.useEffect(() => {
    if (
      refreshToken &&
      password &&
      requestStatus.type === 'VOID' &&
      (expired === null || expired === true || willExpireSoon === true)
    ) {
      getToken(refreshToken, password);
    }
  }, [getToken, password, refreshToken, requestStatus.type, expired, willExpireSoon]);

  // render when we shoudl renew
  useRenderAt(tokenData === null ? null : tokenData.data.exp - AUTO_RENEW_DELAY + 1);

  // render when token is expired
  useRenderAt(tokenData === null ? null : tokenData.data.exp + 1);

  return result;
}

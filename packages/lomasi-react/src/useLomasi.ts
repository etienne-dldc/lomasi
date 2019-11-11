import { UseLomasiAuthTokenOptions, useLomasiAuthToken, UseLomasiAuthTokenResult } from './useLomasiAuthToken';
import { UseLomasiRefreshOptions, useLomasiRefreshToken, UseLomasiRefreshResult } from './useLomasiRefreshToken';

export type UseLomasiOptions = UseLomasiRefreshOptions & Pick<UseLomasiAuthTokenOptions, 'getToken'>;

export type UseLomasiResult = {
  refresh: UseLomasiRefreshResult;
  auth: UseLomasiAuthTokenResult;
};

export function useLomasi(options: UseLomasiOptions): UseLomasiResult {
  const { clearRequestedToken, getToken, login, requestedToken, storageKey } = options;

  const refreshState = useLomasiRefreshToken({
    clearRequestedToken,
    login,
    requestedToken,
    storageKey,
  });

  const authState = useLomasiAuthToken({
    getToken,
    password: refreshState.type === 'LOGGED_IN' ? refreshState.password : null,
    refreshToken: refreshState.type === 'LOGGED_IN' ? refreshState.token : null,
  });

  return {
    refresh: refreshState,
    auth: authState,
  };
}

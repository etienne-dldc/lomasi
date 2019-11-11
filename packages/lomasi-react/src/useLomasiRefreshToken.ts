import React from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import { LomasiToken, LoginResponse } from '@lomasi/common';
import { Token } from './Token';
import { useRenderAt } from './useRenderAt';

type Login = (email: string, password: string) => void;
type SetPassword = (password: string) => void;
type Logout = () => void;
type ConfirmLogin = () => void;
type Reset = () => void;
type SendMail = () => void;
type Cancel = () => void;
type ClearMail = () => void;

type Request =
  | { type: 'VOID' }
  | { type: 'PENDING'; email: string; password: string }
  | { type: 'RESOLVED'; email: string }
  | { type: 'REJECTED'; email: string; password: string; error: string };

export type UseLomasiRefreshResult =
  | { type: 'VOID'; login: Login }
  | { type: 'LOGGED_OUT'; email: string; login: Login; clearMail: ClearMail }
  | { type: 'PENDING'; email: string; password: string }
  | { type: 'MAIL_SEND'; email: string; reset: Reset }
  | { type: 'REJECTED'; email: string; password: string; error: string; login: Login; reset: Reset }
  | { type: 'LOGGED_IN'; token: string; password: string; logout: Logout; setPassword: SetPassword }
  | { type: 'TOKEN_EXPIRED'; token: string; password: string; logout: Logout; sendMail: SendMail }
  | { type: 'PASSWORD_REQUIRED'; token: string; setPassword: SetPassword; logout: Logout }
  | {
      type: 'LOGIN_CONFLICT';
      token: string;
      requestedToken: string;
      confirmLogin: ConfirmLogin;
      logout: Logout;
      cancel: Cancel;
    };

export interface UseLomasiRefreshOptions {
  login: (email: string, password: string) => Promise<LoginResponse>;
  clearRequestedToken: () => void;
  storageKey?: string;
  requestedToken?: string | null;
}

const DEFAULT_STORAGE_KEY = 'lomasi_session/v3';

export function useLomasiRefreshToken(options: UseLomasiRefreshOptions): UseLomasiRefreshResult {
  const { login: doLogin, storageKey = DEFAULT_STORAGE_KEY, requestedToken = null, clearRequestedToken } = options;
  const [currentToken, setToken, getToken] = useLocalStorageState(storageKey);
  const [password, setPassword] = React.useState<null | string>(null);
  const [requestStatus, setRequestStatus] = React.useState<Request>({ type: 'VOID' });

  const reset = React.useCallback(() => {
    setRequestStatus({ type: 'VOID' });
  }, []);

  const logout = React.useCallback(() => {
    if (getToken()) {
      setPassword(null);
      setToken(null);
    }
  }, [getToken, setToken]);

  const confirmLogin = React.useCallback(() => {
    if (requestedToken && currentToken && requestedToken !== currentToken) {
      setToken(requestedToken);
    }
  }, [requestedToken, currentToken, setToken]);

  const cancel = React.useCallback(() => {
    clearRequestedToken();
  }, [clearRequestedToken]);

  const login = React.useCallback(
    async (email: string, password: string): Promise<void> => {
      setRequestStatus({ type: 'PENDING', email, password });
      try {
        await doLogin(email, password);
        setPassword(password);
        setRequestStatus({ type: 'RESOLVED', email });
        return;
      } catch (error) {
        setRequestStatus({
          type: 'REJECTED',
          email,
          password,
          error: error instanceof Error ? error.message : '',
        });
      }
    },
    [doLogin]
  );

  const current = React.useMemo(
    () => (currentToken ? { token: currentToken, data: Token.decode(currentToken) } : null),
    [currentToken]
  );

  const requested = React.useMemo(
    () => (requestedToken ? { token: requestedToken, data: Token.decode(requestedToken) } : null),
    [requestedToken]
  );

  const resultFromRequestStatus = (defaultResult: UseLomasiRefreshResult): UseLomasiRefreshResult => {
    if (requestStatus.type === 'PENDING') {
      return { type: 'PENDING', email: requestStatus.email, password: requestStatus.password };
    }
    if (requestStatus.type === 'REJECTED') {
      return {
        type: 'REJECTED',
        email: requestStatus.email,
        password: requestStatus.password,
        error: requestStatus.error,
        login,
        reset,
      };
    }
    return defaultResult;
  };

  const resultFromToken = (token: { token: string; data: LomasiToken }): UseLomasiRefreshResult => {
    const expired = Token.expired(token.data);
    if (expired) {
      if (password === null) {
        return resultFromRequestStatus({ type: 'LOGGED_OUT', email: token.data.email, login, clearMail: logout });
      }
      const sendMail = () => {
        login(token.data.email, password);
        setToken(null);
      };
      if (requestStatus.type === 'RESOLVED') {
        return { type: 'MAIL_SEND', email: requestStatus.email, reset };
      }
      return resultFromRequestStatus({
        type: 'TOKEN_EXPIRED',
        token: token.token,
        logout,
        password,
        sendMail,
      });
    }
    if (password === null) {
      return { type: 'PASSWORD_REQUIRED', token: token.token, logout, setPassword };
    }
    return { type: 'LOGGED_IN', token: token.token, logout, password, setPassword };
  };

  const result = ((): UseLomasiRefreshResult => {
    const current = currentToken ? { token: currentToken, data: Token.decode(currentToken) } : null;
    const requested = requestedToken ? { token: requestedToken, data: Token.decode(requestedToken) } : null;

    if (current && requested === null) {
      return resultFromToken(current);
    }

    if (requested && current === null) {
      return resultFromToken(requested);
    }

    if (requested && current) {
      if (requested.token === current.token) {
        return resultFromToken(requested);
      }
      const sameAppSameMail = requested.data.email === current.data.email && requested.data.app === current.data.app;
      if (sameAppSameMail) {
        if (requested.data.exp > current.data.exp) {
          // requested is fresher
          return resultFromToken(requested);
        }
        // ignore requested token
        return resultFromToken(current);
      }
      return {
        type: 'LOGIN_CONFLICT',
        token: current.token,
        requestedToken: requested.token,
        logout,
        confirmLogin,
        cancel,
      };
    }
    if (requestStatus.type === 'VOID') {
      return { type: 'VOID', login };
    }
    if (requestStatus.type === 'PENDING') {
      return { type: 'PENDING', email: requestStatus.email, password: requestStatus.password };
    }
    if (requestStatus.type === 'REJECTED') {
      return {
        type: 'REJECTED',
        email: requestStatus.email,
        error: requestStatus.error,
        login,
        reset,
        password: requestStatus.password,
      };
    }
    return { type: 'MAIL_SEND', email: requestStatus.email, reset };
  })();

  // setToken when there is requested but no current
  React.useEffect(() => {
    if (!current && requested) {
      setToken(requested.token);
      return;
    }
  }, [current, requested, setToken]);

  // setToken when requestedToken is fresher than currentToken
  React.useEffect(() => {
    if (current && requested && current.token !== requested.token) {
      const sameAppSameMail =
        requested.data.email && requested.data.email === current.data.email && requested.data.app === current.data.app;
      const requestedFresher = requested.data.exp > current.data.exp;
      if (sameAppSameMail && requestedFresher) {
        setToken(requested.token);
        return;
      }
    }
  }, [current, requested, setToken]);

  // When token is set, we reset the request state
  React.useEffect(() => {
    if (requestStatus.type !== 'VOID' && result.type === 'LOGGED_IN') {
      setRequestStatus({ type: 'VOID' });
    }
  }, [result.type, requestStatus.type]);

  // clear requestedToken when necessary
  React.useEffect(() => {
    if (current && requested && current.token === requested.token) {
      clearRequestedToken();
      return;
    }
  }, [clearRequestedToken, current, requested]);

  // forceRender when token expire
  useRenderAt(current === null ? null : current.data.exp + 1);

  return result;
}

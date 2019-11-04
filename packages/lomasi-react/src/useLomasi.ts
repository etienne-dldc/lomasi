import React from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import { Token } from './Token';

type LoginFn = (email: string, callbackUrl: string) => Promise<void>;
type LogoutFn = () => void;
type ConfirmLoginFn = () => void;
type ResetFn = () => void;

export type UseLomasiResult =
  | { type: 'VOID'; login: LoginFn }
  | { type: 'LOGIN_PENDING'; email: string }
  | { type: 'LOGIN_RESOLVED'; email: string; reset: ResetFn }
  | { type: 'LOGIN_REJECTED'; email: string; error: string; reset: ResetFn }
  | { type: 'LOGGED_IN'; token: string; logout: LogoutFn }
  | { type: 'ALREADY_LOGGED_IN'; currentToken: string; requestedToken: string; confirmLogin: ConfirmLoginFn }
  | { type: 'TOKEN_EXPIRED'; token: string };

export interface UseLomasiOptions {
  server: string;
  storageKey?: string;
  token?: string | null;
}

type LoginRequestStatus =
  | { type: 'VOID' }
  | { type: 'PENDING'; email: string }
  | { type: 'RESOLVED'; email: string }
  | { type: 'REJECTED'; email: string; error: string };

const DEFAULT_STORAGE_KEY = 'lomasi_session/v1';

export function useLomasi(options: UseLomasiOptions): UseLomasiResult {
  const { server, storageKey = DEFAULT_STORAGE_KEY, token: requestedToken = null } = options;
  const [currentToken, setToken] = useLocalStorageState(storageKey);
  const [loginRequest, setLoginRequest] = React.useState<LoginRequestStatus>({ type: 'VOID' });

  // used to force render after setTimeout
  const [timer, setTimer] = React.useState<number>();

  // setToken when requestedToken is fresher than currentToken
  React.useEffect(() => {
    if (!currentToken && requestedToken) {
      setToken(requestedToken);
      return;
    }

    if (currentToken && requestedToken && currentToken !== requestedToken) {
      const current = Token.decode(currentToken);
      const requested = Token.decode(requestedToken);
      const sameAppSameMail = requested.email && requested.email === current.email && requested.app === current.app;
      const requestedFresher = requested.exp > current.exp;
      if (sameAppSameMail && requestedFresher) {
        setToken(requestedToken);
        return;
      }
    }
  }, [currentToken, requestedToken, setToken]);

  const reset = React.useCallback(() => {
    setLoginRequest({ type: 'VOID' });
  }, []);

  const confirmLogin = React.useCallback(() => {
    if (requestedToken && currentToken && requestedToken !== currentToken) {
      setToken(requestedToken);
    }
  }, [requestedToken, currentToken, setToken]);

  const logout = React.useCallback(() => {
    if (currentToken) {
      setToken(null);
    }
  }, [currentToken, setToken]);

  const login = React.useCallback(
    async (email: string, callbackUrl: string): Promise<void> => {
      setLoginRequest({ type: 'PENDING', email });
      try {
        const res = await fetch(`${server}/login`, {
          method: 'post',
          body: JSON.stringify({ email, callback: callbackUrl }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (res.status === 200) {
          setLoginRequest({ type: 'RESOLVED', email });
          return;
        }
        const content = await res.json();
        setLoginRequest({
          type: 'REJECTED',
          email,
          error: `${res.status}: ${content && content.message ? content.message : `Server Error`}`,
        });
      } catch (error) {
        setLoginRequest({
          type: 'REJECTED',
          email,
          error: `Network Error: ${error instanceof Error ? error.message : ''}`,
        });
      }
    },
    [server]
  );

  const result = React.useMemo((): UseLomasiResult => {
    const current = currentToken ? { token: currentToken, data: Token.decode(currentToken) } : null;
    const requested = requestedToken ? { token: requestedToken, data: Token.decode(requestedToken) } : null;

    if (current && requested === null) {
      const expIn = current.data.exp - Date.now() / 1000;
      if (expIn <= 0) {
        return { type: 'TOKEN_EXPIRED', token: current.token };
      }
      return { type: 'LOGGED_IN', token: current.token, logout };
    }

    if (requested && current === null) {
      return { type: 'LOGGED_IN', token: requested.token, logout };
    }

    if (requested && current) {
      if (requested.token === current.token) {
        return { type: 'LOGGED_IN', token: current.token, logout };
      }
      const sameAppSameMail = requested.data.email === current.data.email && requested.data.app === current.data.app;
      if (sameAppSameMail) {
        if (requested.data.exp > current.data.exp) {
          // requested is fresher, consider we are looged in with the nes token
          return { type: 'LOGGED_IN', token: requested.token, logout };
        }
        // ignore requested token
        return { type: 'LOGGED_IN', token: current.token, logout };
      }
      return { type: 'ALREADY_LOGGED_IN', currentToken: current.token, requestedToken: requested.token, confirmLogin };
    }

    if (loginRequest.type === 'VOID') {
      return { type: 'VOID', login };
    }
    if (loginRequest.type === 'PENDING') {
      return { type: 'LOGIN_PENDING', email: loginRequest.email };
    }
    if (loginRequest.type === 'RESOLVED') {
      return { type: 'LOGIN_RESOLVED', email: loginRequest.email, reset };
    }
    if (loginRequest.type === 'REJECTED') {
      return { type: 'LOGIN_REJECTED', email: loginRequest.email, error: loginRequest.error, reset };
    }
    throw new Error('Unreachable !');
  }, [confirmLogin, currentToken, login, loginRequest, logout, requestedToken, reset]);

  // timer
  React.useEffect(() => {
    if (result.type === 'ALREADY_LOGGED_IN' || result.type === 'LOGGED_IN') {
      // when logged in, timeout until expired
      const token = result.type === 'ALREADY_LOGGED_IN' ? result.currentToken : result.token;
      const info = Token.decode(token);
      const expIn = info.exp - Date.now() / 1000;
      if (expIn > 0) {
        const timer = window.setTimeout(() => {
          setTimer(Math.random());
        }, (expIn + 10) * 1000);
        return () => {
          window.clearTimeout(timer);
        };
      }
    }
    return;
  }, [result, timer]);

  return result;
}

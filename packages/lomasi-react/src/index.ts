import React from 'react';
import { useLocalStorageState } from './useLocalStorageState';
import decodeJwt from 'jwt-decode';

type LomasiInternalStatus =
  | { type: 'VOID' }
  | { type: 'LOGGED_IN'; token: string }
  | { type: 'SET_TOKEN'; token: string }
  | { type: 'ALREADY_LOGGED_IN'; currentToken: string; requestedToken: string }
  | { type: 'TOKEN_EXPIRED'; token: string };

type LomasiStatus =
  | { type: 'VOID' }
  | { type: 'LOGGED_IN'; token: string }
  | { type: 'ALREADY_LOGGED_IN'; currentToken: string; requestedToken: string }
  | { type: 'TOKEN_EXPIRED'; token: string };

interface LomasiToken {
  email: string;
  app: string;
  iat: number;
  exp: number;
}

interface LomasiResult {
  login(email: string, callbackUrl: string): Promise<Response>;
  logout(): void;
  confirmLogin(): void;
  status: LomasiStatus;
}

interface Options {
  loginRoute: string;
  storageKey?: string;
  token?: string | null;
}

const DEFAULT_STORAGE_KEY = 'lomasi_session/v1';

export function useLomasi(options: Options): LomasiResult {
  const { loginRoute, storageKey = DEFAULT_STORAGE_KEY, token = null } = options;
  const [currentToken, setToken] = useLocalStorageState(storageKey);

  // used to force render after setTimeout
  const [timer, setTimer] = React.useState<number>();

  const internalStatus = React.useMemo((): LomasiInternalStatus => {
    if (currentToken) {
      const currentInfo = decodeJwt<LomasiToken>(currentToken);
      if (token && currentToken !== token) {
        const requestInfo = decodeJwt<LomasiToken>(token);
        if (requestInfo.email && requestInfo.email === currentInfo.email && requestInfo.app === currentInfo.app) {
          if (requestInfo.exp > currentInfo.exp) {
            // requested is fresher, just update
            return { type: 'SET_TOKEN', token };
          }
          // ignore requested token
          return { type: 'LOGGED_IN', token: currentToken };
        }
        return { type: 'ALREADY_LOGGED_IN', currentToken, requestedToken: token };
      }
      const expIn = currentInfo.exp - Date.now() / 1000;
      if (expIn <= 0) {
        return { type: 'TOKEN_EXPIRED', token: currentToken };
      }
      return { type: 'LOGGED_IN', token: currentToken };
    }
    if (token) {
      return { type: 'SET_TOKEN', token };
    }
    return { type: 'VOID' };
  }, [currentToken, token]);

  React.useEffect(() => {
    // When token change
    if (internalStatus.type === 'SET_TOKEN') {
      setToken(internalStatus.token);
    }
  }, [internalStatus]);

  const status = React.useMemo((): LomasiStatus => {
    if (internalStatus.type === 'SET_TOKEN') {
      return { type: 'LOGGED_IN', token: internalStatus.token };
    }
    return internalStatus;
  }, [internalStatus]);

  React.useEffect(() => {
    if (status.type === 'ALREADY_LOGGED_IN' || status.type === 'LOGGED_IN') {
      // when logged in, timeout until expired
      const token = status.type === 'ALREADY_LOGGED_IN' ? status.currentToken : status.token;
      const info = decodeJwt<LomasiToken>(token);
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
  }, [status, timer]);

  const confirmLogin = React.useCallback(() => {
    if (token && currentToken && token !== currentToken) {
      setToken(token);
    }
  }, [token, currentToken]);

  const logout = React.useCallback(() => {
    if (currentToken) {
      setToken(null);
    }
  }, [currentToken]);

  const login = React.useCallback(
    async (email: string, callbackUrl: string): Promise<Response> => {
      const res = await fetch(loginRoute, {
        method: 'post',
        body: JSON.stringify({ email, callback: callbackUrl }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return res;
    },
    [loginRoute]
  );

  return {
    login,
    logout,
    confirmLogin,
    status,
  };

  // React.useEffect(() => {
  //   //

  // }, []);

  // const bcRef = React.useRef<Broadcast<Message> | null>(null);

  // const [storedToken, setStoredToken] = React.useState<string | null>(() => localStorage.getItem(storageKey));

  // return {
  //   login,
  //   token: storedToken,
  // };
}

import React from 'react';
import { useLocalStorageState } from './utils/useLocalStorageState';
import { LomasiToken, LoginResponse } from '@lomasi/common';
import { Token } from './Token';
import { useRenderAt } from './utils/useRenderAt';

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
  | { type: 'RESOLVED' }
  | { type: 'REJECTED'; email: string; password: string; error: string };

export type UseLomasiRefreshResult =
  | { type: 'VOID'; login: Login }
  | { type: 'LOGGED_OUT'; email: string; login: Login; clearMail: ClearMail }
  | { type: 'PENDING'; email: string; password: string }
  | { type: 'WAITING_FOR_TOKEN'; email: string; reset: Reset }
  | { type: 'REJECTED'; email: string; password: string; error: string; login: Login; reset: Reset }
  | { type: 'LOGGED_IN'; token: string; password: string; logout: Logout; setPassword: SetPassword }
  | { type: 'TOKEN_EXPIRED'; token: string; password: string; logout: Logout; sendMail: SendMail }
  | { type: 'PASSWORD_REQUIRED'; email: string; setPassword: SetPassword; logout: Logout }
  | {
      type: 'LOGIN_CONFLICT';
      currentEmail: string;
      requestedEmail: string;
      // confirm the login request
      confirmLogin: ConfirmLogin;
      // cancel the login request
      cancel: Cancel;
      logout: Logout;
    };

export interface UseLomasiRefreshOptions {
  login: (email: string, password: string) => Promise<LoginResponse>;
  clearRequestedToken: () => void;
  tokenStorageKey?: string;
  emailStorageKey?: string;
  requestedToken?: string | null;
}

type DecodedToken = { token: string; data: LomasiToken };

interface ResultActions {
  setToken?: string | null;
  setEmail?: string | null;
  clearRequest?: boolean;
}

const DEFAULT_TOKEN_STORAGE_KEY = 'lomasi_storage_token/v3';
const DEFAULT_EMAIL_STORAGE_KEY = 'lomasi_storage_email/v3';

export function useLomasiRefreshToken(options: UseLomasiRefreshOptions): UseLomasiRefreshResult {
  const {
    login: doLogin,
    tokenStorageKey = DEFAULT_TOKEN_STORAGE_KEY,
    emailStorageKey = DEFAULT_EMAIL_STORAGE_KEY,
    requestedToken = null,
    clearRequestedToken,
  } = options;
  const [currentToken, setToken, getToken] = useLocalStorageState(tokenStorageKey);
  const [email, setEmail] = useLocalStorageState(emailStorageKey);
  const [password, setPassword] = React.useState<null | string>(null);
  const [requestStatus, setRequestStatus] = React.useState<Request>({ type: 'VOID' });

  /**
   * Actions
   */

  // reset the request status
  const reset = React.useCallback(() => {
    setRequestStatus({ type: 'VOID' });
    setEmail(null);
  }, [setEmail]);

  const logout = React.useCallback(() => {
    if (getToken()) {
      setEmail(null);
      setPassword(null);
      setToken(null);
    }
  }, [getToken, setEmail, setToken]);

  // when conflict => use requested (override current)
  const confirmLogin = React.useCallback(() => {
    if (requestedToken && currentToken && requestedToken !== currentToken) {
      const requested = Token.decode(requestedToken);
      setEmail(requested.email);
      setToken(requestedToken);
      setPassword(null);
    }
  }, [requestedToken, currentToken, setEmail, setToken]);

  // when conflict => keep current (clear requested)
  const cancel = React.useCallback(() => {
    clearRequestedToken();
  }, [clearRequestedToken]);

  const login = React.useCallback(
    async (email: string, password: string): Promise<void> => {
      setRequestStatus({ type: 'PENDING', email, password });
      try {
        const res = await doLogin(email, password);
        if (res.type === 'MailSend') {
          setEmail(email);
          setPassword(password);
          setRequestStatus({ type: 'RESOLVED' });
          return;
        }
        setRequestStatus({
          type: 'REJECTED',
          email,
          password,
          error: res.type,
        });
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
    [doLogin, setEmail]
  );

  /**
   * Tokens
   * If exist, decode current & requested token
   */

  console.log({
    currentToken,
    requestedToken,
  });

  const current: DecodedToken | null = React.useMemo(
    () => (currentToken ? { token: currentToken, data: Token.decode(currentToken) } : null),
    [currentToken]
  );

  const requested: DecodedToken | null = React.useMemo(
    () => (requestedToken ? { token: requestedToken, data: Token.decode(requestedToken) } : null),
    [requestedToken]
  );

  /**
   * Result
   */

  const actions: ResultActions = {};

  const result = computeResult({
    email,
    current,
    requested,
    actions,
    cancel,
    confirmLogin,
    login,
    logout,
    password,
    requestStatus,
    reset,
    setPassword,
    setToken,
  });

  React.useLayoutEffect(() => {
    if (actions.clearRequest !== undefined) {
      clearRequestedToken();
    }
    if (actions.setEmail !== undefined) {
      setEmail(actions.setEmail);
    }
    if (actions.setToken !== undefined) {
      setToken(actions.setToken);
    }
  });

  // forceRender when token expire
  useRenderAt(current === null ? null : current.data.exp + 1);

  return result;
}

interface Options {
  email: string | null;
  current: DecodedToken | null;
  requested: DecodedToken | null;
  actions: ResultActions;
  login: Login;
  cancel: Cancel;
  logout: Logout;
  confirmLogin: ConfirmLogin;
  password: string | null;
  setPassword: SetPassword;
  requestStatus: Request;
  reset: Reset;
  setToken: (token: string | null) => void;
}

function computeResult(options: Options): UseLomasiRefreshResult {
  const { actions, cancel, confirmLogin, current, email, login, logout, requested, password, setPassword } = options;
  if (email === null) {
    if (requested) {
      // if requested we use it login user
      actions.setEmail = requested.data.email;
      actions.setToken = requested.token;
      actions.clearRequest = true;
      return resultFromToken(options, requested, requested.data.email);
    }
    // if current is defined
    if (current) {
      // we have a token but email is null
      // this should not happened
      // in doubt we clean up the token
      actions.setToken = null;
    }
    return { type: 'VOID', login };
  }
  // at this point we have an email
  // and only an user action can unset it

  const requestedValid = requested && requested.data.email === email;
  const currentValid = current && current.data.email === email;

  // we only have a requested
  if (requested && current === null) {
    return resultFromRequestedOnly(options, requested, email);
  }

  // we only have current
  if (current && requested === null) {
    if (currentValid) {
      return resultFromToken(options, current, email);
    }
    // current not valid, we clean it
    actions.setToken = null;
    // no token but we have an email
    if (password === null) {
      return { type: 'PASSWORD_REQUIRED', email, logout, setPassword };
    }
    // we have email & passeword
    // the result depend on the request
    return resultFromRequestStatus(options, email);
  }

  if (current && requested) {
    if (currentValid === false) {
      return resultFromRequestedOnly(options, requested, email);
    }
    // we have email, current & requested (current is valid)
    if (requestedValid === false) {
      // this a conflict
      return {
        type: 'LOGIN_CONFLICT',
        currentEmail: email,
        requestedEmail: requested.data.email,
        cancel,
        confirmLogin,
        logout,
      };
    }
    // use the fresher between current and requested;
    if (requested.data.exp > current.data.exp) {
      // requested is fresher
      actions.setToken = requested.token;
      return resultFromToken(options, requested, email);
    }
    // ignore requested token
    actions.clearRequest = true;
    return resultFromToken(options, current, email);
  }
  // we only have email
  if (password === null) {
    return { type: 'PASSWORD_REQUIRED', email, logout, setPassword };
  }
  // we have email & passeword
  // the result depend on the request
  return resultFromRequestStatus(options, email);
}

function resultFromRequestStatus(options: Options, email: string): UseLomasiRefreshResult {
  const { requestStatus, reset, login, logout } = options;
  if (requestStatus.type === 'RESOLVED') {
    // we have send a mail
    return { type: 'WAITING_FOR_TOKEN', email, reset };
  }
  if (requestStatus.type === 'PENDING') {
    return { type: 'PENDING', email: requestStatus.email, password: requestStatus.password };
  }
  if (requestStatus.type === 'REJECTED') {
    const { email, password, error } = requestStatus;
    return { type: 'REJECTED', email, password, error, login, reset };
  }
  if (requestStatus.type === 'VOID') {
    return { type: 'LOGGED_OUT', clearMail: logout, email, login };
  }
  throw new Error(`Unexpected state`);
}

function resultFromRequestedOnly(options: Options, requested: DecodedToken, email: string): UseLomasiRefreshResult {
  const { actions, logout, cancel, confirmLogin } = options;
  const requestedValid = requested.data.email === email;
  if (requestedValid) {
    // use requested to authent
    actions.setEmail = requested.data.email;
    actions.setToken = requested.token;
    actions.clearRequest = true;
    return resultFromToken(options, requested, email);
  }
  return {
    type: 'LOGIN_CONFLICT',
    currentEmail: email,
    requestedEmail: requested.data.email,
    cancel,
    logout,
    confirmLogin,
  };
}

function resultFromToken(options: Options, token: DecodedToken, email: string): UseLomasiRefreshResult {
  const { password, logout, setPassword, requestStatus, login, setToken } = options;
  const expired = Token.expired(token.data);
  if (expired) {
    if (password === null) {
      return { type: 'PASSWORD_REQUIRED', email, logout, setPassword };
    }
    if (requestStatus.type === 'VOID' || requestStatus.type === 'RESOLVED') {
      const sendMail = () => {
        login(token.data.email, password);
        setToken(null);
      };
      return {
        type: 'TOKEN_EXPIRED',
        token: token.token,
        logout,
        password,
        sendMail,
      };
    }
    return resultFromRequestStatus(options, email);
  }
  if (password === null) {
    return { type: 'PASSWORD_REQUIRED', email, logout, setPassword };
  }
  return { type: 'LOGGED_IN', token: token.token, logout, password, setPassword };
}

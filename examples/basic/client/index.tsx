import { render } from 'react-dom';
import React from 'react';
import {
  useLomasiRefreshToken,
  Token,
  LoginBody,
  LoginResponse,
  AuthenticateResponse,
  AuthenticateBody,
  UseLomasiAuthTokenResult,
} from '@lomasi/react';
import { createBrowserHistory } from 'history';
import querystring from 'query-string';
import { Clock, LoginForm, PasswordForm, UntilClock } from './elements';

const history = createBrowserHistory();

const App: React.FC = () => {
  const [location, setLocation] = React.useState(() => history.location);
  const query = querystring.parse(location.search);
  const qtoken = query.token;
  const requestedToken = Array.isArray(qtoken) ? qtoken[0] : qtoken || null;

  React.useEffect(() => {
    return history.listen(loc => setLocation(loc));
  }, []);

  const clearRequestedToken = React.useCallback(() => {
    history.replace(location.pathname);
  }, [location.pathname]);

  const login = React.useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    const body: LoginBody = { email, password, callback: 'http://localhost:1234/login?token={{TOKEN}}' };
    const res = await fetch(`http://localhost:3010/login`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const content = await res.json();
    if (res.status === 200) {
      return content;
    }
    throw new Error(`${content && content.message ? content.message : 'Server Error'}`);
  }, []);

  // const getToken = React.useCallback(async (token: string, password: string): Promise<AuthenticateResponse> => {
  //   const body: AuthenticateBody = { password, token };
  //   const res = await fetch(`http://localhost:3010/authenticate`, {
  //     method: 'post',
  //     body: JSON.stringify(body),
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });
  //   const content = await res.json();
  //   if (res.status === 200) {
  //     return content;
  //   }
  //   throw new Error(`Server Error: ${content && content.message ? content.message : 'error'}`);
  // }, []);

  const lomasiState = useLomasiRefreshToken({
    login,
    requestedToken,
    clearRequestedToken,
  });

  // let lomasiAuth = useLomasiAuthToken({
  //   getToken,
  //   password: lomasiState.type === 'LOGGED_IN' ? lomasiState.password : null,
  //   refreshToken: lomasiState.type === 'LOGGED_IN' ? lomasiState.token : null,
  // });

  const lomasiAuth: UseLomasiAuthTokenResult = { type: 'VOID' } as UseLomasiAuthTokenResult;

  return (
    <div>
      <h1>Hello</h1>
      <Clock />
      <pre>{JSON.stringify(lomasiState, null, 2)}</pre>
      <pre>{JSON.stringify(lomasiAuth, null, 2)}</pre>
      {(() => {
        if (lomasiState.type === 'LOGGED_IN') {
          const current = Token.decode(lomasiState.token);
          return (
            <div>
              <p>
                Logged in as {current.email} for <UntilClock end={current.exp} /> !
              </p>
              <button onClick={() => lomasiState.logout()}>Logout</button>
              {(() => {
                if (lomasiAuth.type === 'LOGGED_IN') {
                  const currentAuth = Token.decode(lomasiAuth.token);
                  return (
                    <p>
                      Logged in as {currentAuth.email} for <UntilClock end={currentAuth.exp} /> !
                    </p>
                  );
                }
                if (lomasiAuth.type === 'PENDING') {
                  return <p>Loading...</p>;
                }
                if (lomasiAuth.type === 'REJECTED') {
                  return (
                    <div>
                      <p>{lomasiAuth.error}</p>
                      <PasswordForm
                        initialPassword={''}
                        onValidate={pass => {
                          lomasiState.setPassword(pass);
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          );
        }
        if (lomasiState.type === 'VOID' || lomasiState.type === 'REJECTED' || lomasiState.type === 'LOGGED_OUT') {
          const initEmail = lomasiState.type === 'VOID' ? '' : lomasiState.email;
          const initPassword = lomasiState.type === 'REJECTED' ? lomasiState.password : '';
          return (
            <div>
              <LoginForm
                key={lomasiState.type}
                initialEmail={initEmail}
                initialPassword={initPassword}
                onValidate={(email, password) => {
                  lomasiState.login(email, password);
                }}
              />
              {lomasiState.type === 'REJECTED' && <p>{lomasiState.error}</p>}
              {lomasiState.type === 'LOGGED_OUT' && <button onClick={() => lomasiState.clearMail()}>Clear</button>}
            </div>
          );
        }
        if (lomasiState.type === 'TOKEN_EXPIRED') {
          return (
            <div>
              <p>Token Expired</p>
              <button onClick={() => lomasiState.sendMail()}>Re-send Mail</button>
            </div>
          );
        }
        if (lomasiState.type === 'PENDING') {
          return <div>Pending...</div>;
        }
        if (lomasiState.type === 'WAITING_FOR_TOKEN') {
          return <div>Check your mail</div>;
        }
        if (lomasiState.type === 'PASSWORD_REQUIRED') {
          // const info = Token.decode(lomasiState.token);
          return (
            <div>
              <p>Password for mail: {lomasiState.email} (info.exp ?)</p>
              <PasswordForm
                initialPassword={''}
                onValidate={pass => {
                  lomasiState.setPassword(pass);
                }}
              />
              <button onClick={() => lomasiState.logout()}>Logout</button>
            </div>
          );
        }
        if (lomasiState.type === 'LOGIN_CONFLICT') {
          // const current = Token.decode(lomasiState.token);
          // const requested = Token.decode(lomasiState.requestedToken);
          return (
            <div>
              <p>You are already logged in as {lomasiState.currentEmail}</p>
              <button onClick={() => lomasiState.confirmLogin()}>Log in as {lomasiState.requestedEmail}</button>
              <button onClick={() => lomasiState.cancel()}>Stay logged in as {lomasiState.currentEmail}</button>
            </div>
          );
        }

        return null;
      })()}
    </div>
  );
};

render(<App />, document.getElementById('root'));

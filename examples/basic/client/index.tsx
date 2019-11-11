import { render } from 'react-dom';
import React from 'react';
import {
  useLomasiRefreshToken,
  useLomasiAuthToken,
  Token,
  LoginBody,
  LoginResponse,
  AuthenticateResponse,
  AuthenticateBody,
} from '@lomasi/react';
import { createBrowserHistory } from 'history';
import querystring from 'query-string';

const history = createBrowserHistory();

const PasswordForm: React.FC<{
  initialPassword: string;
  onValidate: (password: string) => void;
}> = ({ initialPassword, onValidate }) => {
  const [password, setPassword] = React.useState(initialPassword);

  return (
    <div>
      <input
        type="text"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onValidate(password);
          }
        }}
      />
    </div>
  );
};

const LoginForm: React.FC<{
  initialEmail: string;
  initialPassword: string;
  onValidate: (email: string, password: string) => void;
}> = ({ initialEmail, initialPassword, onValidate }) => {
  const [email, setEmail] = React.useState(initialEmail);
  const [password, setPassword] = React.useState(initialPassword);

  return (
    <div>
      <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
      <br />
      <input
        type="text"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="password"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onValidate(email, password);
          }
        }}
      />
    </div>
  );
};

const Clock: React.FC = () => {
  const [time, setTime] = React.useState(nowInSec());

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTime(nowInSec());
    }, 500);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return <div>{time}</div>;
};

const UntilClock: React.FC<{ end: number }> = ({ end }) => {
  const [time, setTime] = React.useState(nowInSec());

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTime(nowInSec());
    }, 500);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return <span>{end - time}s</span>;
};

const nowInSec = () => Math.floor(Date.now() / 1000);

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

  const getToken = React.useCallback(async (token: string, password: string): Promise<AuthenticateResponse> => {
    const body: AuthenticateBody = { password, token };
    const res = await fetch(`http://localhost:3010/authenticate`, {
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
    throw new Error(`Server Error: ${content && content.message ? content.message : 'error'}`);
  }, []);

  const lomasiState = useLomasiRefreshToken({
    login,
    requestedToken,
    clearRequestedToken,
  });

  const lomasiAuth = useLomasiAuthToken({
    getToken,
    password: lomasiState.type === 'LOGGED_IN' ? lomasiState.password : null,
    refreshToken: lomasiState.type === 'LOGGED_IN' ? lomasiState.token : null,
  });

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
        if (lomasiState.type === 'MAIL_SEND') {
          return <div>Check your mail</div>;
        }
        if (lomasiState.type === 'PASSWORD_REQUIRED') {
          const info = Token.decode(lomasiState.token);
          return (
            <div>
              <p>
                Password for mail: {info.email} ({info.exp})
              </p>
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
          const current = Token.decode(lomasiState.token);
          const requested = Token.decode(lomasiState.requestedToken);
          return (
            <div>
              <p>You are already logged in as {current.email}</p>
              <button onClick={() => lomasiState.confirmLogin()}>Log in as {requested.email}</button>
              <button onClick={() => lomasiState.cancel()}>Stay logged in as {current.email}</button>
            </div>
          );
        }

        return null;
      })()}
    </div>
  );
};

render(<App />, document.getElementById('root'));

import { render } from 'react-dom';
import React from 'react';
import { useLomasi } from '@lomasi/react';
import { createBrowserHistory } from 'history';
import querystring from 'query-string';
import decodeJwt from 'jwt-decode';

const history = createBrowserHistory();

const App: React.FC = () => {
  const [email, setEmail] = React.useState('etienne.dldc@outlook.fr');
  const [location, setLocation] = React.useState(() => history.location);
  const query = querystring.parse(location.search);
  const qtoken = query.token;
  const token = Array.isArray(qtoken) ? qtoken[0] : qtoken || null;

  React.useEffect(() => {
    return history.listen(loc => setLocation(loc));
  }, []);

  const { login, status, confirmLogin, logout } = useLomasi({
    loginRoute: 'http://localhost:3010/login',
    token,
  });

  const decoded = status.type === 'LOGGED_IN' ? decodeJwt<{ email: string; exp: number }>(status.token) : null;

  React.useEffect(() => {
    if (status.type === 'LOGGED_IN' && token) {
      history.replace(location.pathname);
    }
  }, [token, status, location]);

  return (
    <div>
      <h1>Hello</h1>
      <input type="text" value={email} onChange={e => setEmail(e.target.value)} />

      {location.pathname === '/login' && status.type === 'LOGGED_IN' && (
        <div>
          <button
            onClick={() => {
              window.close();
            }}
          >
            Close this tab
          </button>
        </div>
      )}

      <button
        onClick={() => {
          login(email, 'http://localhost:1234/login?token={{TOKEN}}');
        }}
      >
        Login
      </button>
      <button
        onClick={() => {
          logout();
        }}
      >
        Logout
      </button>
      {status.type === 'ALREADY_LOGGED_IN' && <button onClick={() => confirmLogin()}>Confirm Login</button>}
      {decoded && (
        <p>
          Logged in as {decoded.email} until {decoded.exp}
        </p>
      )}
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
};

render(<App />, document.getElementById('root'));

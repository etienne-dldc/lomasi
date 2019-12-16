import React from 'react';

const nowInSec = () => Math.floor(Date.now() / 1000);

export const PasswordForm: React.FC<{
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

export const LoginForm: React.FC<{
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

export const Clock: React.FC = () => {
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

export const UntilClock: React.FC<{ end: number }> = ({ end }) => {
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

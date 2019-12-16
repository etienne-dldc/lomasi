import { LomasiServer, Mailer } from '@lomasi/server';

const mailer: Mailer = {
  async sendMail({ text }) {
    console.log(text);
  },
};

const server = LomasiServer.create({
  apps: [
    {
      origin: 'http://localhost:1234',
      refreshToken: {
        jwtSecret: 'auth-not-so-secret',
        jwtExpireIn: '20m',
      },
      authToken: {
        jwtSecret: 'mail-not-so-secret',
        jwtExpireIn: '30s',
      },
    },
  ],
  mailer,
});

server.listen(3010, () => {
  console.log('Server is up on http://localhost:3010/ !');
});

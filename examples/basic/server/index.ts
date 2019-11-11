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
      jwtAuthSecret: 'auth-not-so-secret',
      jwtMailSecret: 'mail-not-so-secret',
      jwtAuthExpireIn: '30s',
      jwtMailExpireIn: '20m',
    },
  ],
  mailer,
});

server.listen(3010, () => {
  console.log('Server is up on http://localhost:3010/ !');
});

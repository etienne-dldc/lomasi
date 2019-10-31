import { LomasiServer, Mailer } from '@lomasi/server';

const mailer: Mailer = {
  async sendMail({ text }) {
    console.log(text);
  },
};

const server = LomasiServer.create({
  apps: [
    {
      domain: 'localhost:1234',
      jwtTokenSecret: 'not-so-secret',
    },
  ],
  mailer,
});

server.listen(3010, () => {
  console.log('Server is up on http://localhost:3010/ !');
});

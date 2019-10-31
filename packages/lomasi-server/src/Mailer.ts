interface Message {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface Mailer {
  sendMail(msg: Message): Promise<void>;
}

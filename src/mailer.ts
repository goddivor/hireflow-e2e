import nodemailer from "nodemailer";

export type Mailer = {
  send(to: string, subject: string, text: string, html: string): Promise<void>;
};

export function createMailer(host: string, port: number): Mailer {
  const transport = nodemailer.createTransport({ host, port, secure: false });
  return {
    async send(to, subject, text, html) {
      await transport.sendMail({ from: "Taskflow <no-reply@taskflow.test>", to, subject, text, html });
    },
  };
}

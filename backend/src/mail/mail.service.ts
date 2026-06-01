import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  interviewEmail,
  rejectedEmail,
  testSentEmail,
  welcomeEmail,
} from './mail.templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly frontendBase: string;

  constructor(private config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.from =
      config.get<string>('MAIL_FROM') ?? 'Hire Flow <noreply@hireflow.local>';
    this.frontendBase = (
      config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'
    ).replace(/\/$/, '');

    if (host) {
      const port = Number(config.get<string>('SMTP_PORT') ?? '1025');
      const secure = config.get<string>('SMTP_SECURE') === 'true';
      this.transporter = nodemailer.createTransport({
        host,
        port: Number.isFinite(port) ? port : 1025,
        secure,
        auth:
          config.get<string>('SMTP_USER') && config.get<string>('SMTP_PASS')
            ? {
                user: config.get<string>('SMTP_USER'),
                pass: config.get<string>('SMTP_PASS'),
              }
            : undefined,
      });
      this.logger.log(`Mail transport: ${host}:${port}`);
    } else {
      this.transporter = null;
      this.logger.warn('SMTP_HOST not set — emails will be skipped');
    }
  }

  private loginUrl(): string {
    return `${this.frontendBase}/login`;
  }

  private applicationsUrl(): string {
    return `${this.frontendBase}/applications`;
  }

  private dispatch(
    to: string,
    content: { subject: string; text: string; html: string },
  ): void {
    if (!this.transporter) {
      return;
    }
    void this.transporter
      .sendMail({
        from: this.from,
        to,
        subject: content.subject,
        text: content.text,
        html: content.html,
      })
      .then(() => {
        this.logger.log(`Email sent to ${to}: ${content.subject}`);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to send email to ${to}: ${msg}`);
      });
  }

  sendWelcome(to: string, name?: string | null): void {
    this.dispatch(to, welcomeEmail({ name, loginUrl: this.loginUrl() }));
  }

  sendTestSent(
    to: string,
    jobTitle: string,
    name?: string | null,
  ): void {
    this.dispatch(
      to,
      testSentEmail({
        name,
        jobTitle,
        applicationsUrl: this.applicationsUrl(),
      }),
    );
  }

  sendRejected(to: string, jobTitle: string, name?: string | null): void {
    this.dispatch(to, rejectedEmail({ name, jobTitle }));
  }

  sendInterview(to: string, jobTitle: string, name?: string | null): void {
    this.dispatch(
      to,
      interviewEmail({
        name,
        jobTitle,
        applicationsUrl: this.applicationsUrl(),
      }),
    );
  }
}

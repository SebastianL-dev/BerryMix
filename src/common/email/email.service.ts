import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.get<string>('env.resend_api_key'),
    );
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ) {
    const verificationLink = `${this.configService.get<string>('env.front.dev')}/verify-email?token=${verificationToken}`;

    return await this.resend.emails.send({
      from: 'BerryMix <berrymix@resend.dev>',
      to: [email],
      subject: `Hola ${name}`,
      html: `<strong>Si sirve</strong>
      <a href="${verificationLink}">Click para verificar</a>`,
    });
  }
}

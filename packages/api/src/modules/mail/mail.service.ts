import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly backofficeUrl: string;
  private readonly from: string;
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    this.backofficeUrl = config.get<string>('BACKOFFICE_URL') ?? 'http://localhost:5173';
    this.from = config.get<string>('SMTP_FROM') ?? 'noreply@lootopia.fr';

    const smtpHost = config.get<string>('SMTP_HOST');
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: config.get<number>('SMTP_PORT') ?? 587,
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASS'),
        },
      });
    } else {
      this.transporter = null;
      this.logger.warn('SMTP_HOST non configuré — emails loggués en console');
    }
  }

  async sendPartnerInvitation(
    email: string,
    token: string,
    partnerName?: string,
  ): Promise<void> {
    const activationLink = `${this.backofficeUrl}/register?token=${token}`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Invitation à rejoindre Lootopia',
        html: this.buildInvitationHtml(partnerName ?? email, activationLink),
      });
    } else {
      this.logger.log(
        `[INVITATION] Destinataire: ${email}${partnerName ? ` (${partnerName})` : ''}\n` +
          `Lien d'activation (valable 72h) : ${activationLink}`,
      );
    }
  }

  async sendPartnerWelcome(email: string): Promise<void> {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: 'Bienvenue sur Lootopia !',
        html: this.buildWelcomeHtml(email),
      });
    } else {
      this.logger.log(`[BIENVENUE] Compte partenaire créé pour ${email}`);
    }
  }

  private buildInvitationHtml(name: string, activationLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h1 style="color:#F97316">Lootopia</h1>
  <h2>Vous êtes invité à rejoindre Lootopia</h2>
  <p>Bonjour <strong>${name}</strong>,</p>
  <p>
    Un administrateur Lootopia vous invite à créer votre compte partenaire.
    Ce lien est valable <strong>72 heures</strong>.
  </p>
  <p style="text-align:center;margin:30px 0">
    <a href="${activationLink}"
       style="background:#F97316;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold">
      Créer mon compte
    </a>
  </p>
  <p style="color:#999;font-size:12px">
    Si vous ne pouvez pas cliquer sur le bouton, copiez ce lien dans votre navigateur :<br>
    ${activationLink}
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
  <p style="color:#999;font-size:11px">Lootopia — Out of Cache</p>
</body>
</html>`;
  }

  private buildWelcomeHtml(email: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h1 style="color:#F97316">Lootopia</h1>
  <h2>Bienvenue sur Lootopia !</h2>
  <p>Votre compte partenaire (<strong>${email}</strong>) a bien été créé.</p>
  <p>Vous pouvez maintenant vous connecter au backoffice partenaire pour gérer vos chasses.</p>
  <p style="text-align:center;margin:30px 0">
    <a href="${this.backofficeUrl}/login"
       style="background:#F97316;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold">
      Accéder au backoffice
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
  <p style="color:#999;font-size:11px">Lootopia — Out of Cache</p>
</body>
</html>`;
  }
}

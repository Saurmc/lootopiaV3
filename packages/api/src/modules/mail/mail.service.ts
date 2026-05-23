import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly backofficeUrl: string;

  constructor(private readonly config: ConfigService) {
    this.backofficeUrl = config.get<string>('BACKOFFICE_URL') ?? 'http://localhost:5173';
  }

  async sendPartnerInvitation(
    email: string,
    token: string,
    partnerName?: string,
  ): Promise<void> {
    const activationLink = `${this.backofficeUrl}/register?token=${token}`;

    // En production, remplacer ce bloc par un appel nodemailer / service SMTP.
    this.logger.log(
      `[INVITATION] Destinataire: ${email}${partnerName ? ` (${partnerName})` : ''}\n` +
        `Lien d'activation (valable 72h) : ${activationLink}`,
    );
  }

  async sendPartnerWelcome(email: string): Promise<void> {
    this.logger.log(`[BIENVENUE] Compte partenaire créé pour ${email}`);
  }
}

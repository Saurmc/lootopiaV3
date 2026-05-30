import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer');

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = nodemailer.createTransport as jest.MockedFunction<
  typeof nodemailer.createTransport
>;

const makeConfigService = (overrides: Record<string, unknown> = {}) => {
  const values: Record<string, unknown> = {
    BACKOFFICE_URL: 'http://localhost:5173',
    SMTP_HOST: 'sandbox.smtp.mailtrap.io',
    SMTP_PORT: 2525,
    SMTP_USER: 'test-user',
    SMTP_PASS: 'test-pass',
    SMTP_FROM: 'noreply@lootopia.fr',
    ...overrides,
  };
  return { get: jest.fn((key: string) => values[key]) };
};

describe('MailService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('avec SMTP configuré', () => {
    let service: MailService;

    beforeEach(async () => {
      mockCreateTransport.mockReturnValue({ sendMail: mockSendMail } as never);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: makeConfigService() },
        ],
      }).compile();

      service = module.get(MailService);
    });

    it('sendPartnerInvitation envoie un email avec le lien d\'activation', async () => {
      await service.sendPartnerInvitation('partner@example.com', 'abc123', 'Partenaire Test');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'partner@example.com',
          subject: expect.stringContaining('Lootopia'),
          html: expect.stringContaining('http://localhost:5173/register?token=abc123'),
        }),
      );
    });

    it('sendPartnerInvitation fonctionne sans partnerName', async () => {
      await service.sendPartnerInvitation('partner@example.com', 'abc123');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'partner@example.com' }),
      );
    });

    it('sendPartnerWelcome envoie un email de bienvenue', async () => {
      await service.sendPartnerWelcome('partner@example.com');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'partner@example.com',
          subject: expect.stringContaining('Bienvenue'),
        }),
      );
    });
  });

  describe('sans SMTP configuré (fallback console)', () => {
    let service: MailService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          { provide: ConfigService, useValue: makeConfigService({ SMTP_HOST: undefined }) },
        ],
      }).compile();

      service = module.get(MailService);
    });

    it('sendPartnerInvitation ne déclenche pas nodemailer', async () => {
      await service.sendPartnerInvitation('partner@example.com', 'abc123');
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('sendPartnerWelcome ne déclenche pas nodemailer', async () => {
      await service.sendPartnerWelcome('partner@example.com');
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});

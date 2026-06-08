import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { MailService } from '../mail/mail.service';
import { InvitationEntity } from './entities/invitation.entity';

const makeInvitation = (overrides: Partial<InvitationEntity> = {}): InvitationEntity => ({
  id: 'inv-1',
  email: 'partner@example.com',
  token: 'valid-token',
  partner_name: null,
  expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
  used_at: null,
  created_by_id: 'admin-id',
  created_at: new Date(),
  ...overrides,
});

describe('InvitationsService', () => {
  let service: InvitationsService;
  let repo: jest.Mocked<InvitationsRepository>;
  let mail: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: InvitationsRepository,
          useValue: {
            save: jest.fn(),
            findByToken: jest.fn(),
            findByEmail: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: { sendPartnerInvitation: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(InvitationsService);
    repo = module.get(InvitationsRepository);
    mail = module.get(MailService);
  });

  describe('create', () => {
    it('crée une invitation et envoie un email', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.save.mockResolvedValue(makeInvitation());
      mail.sendPartnerInvitation.mockResolvedValue(undefined);

      const result = await service.create({ email: 'partner@example.com' }, 'admin-id');

      expect(result.email).toBe('partner@example.com');
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'partner@example.com', used_at: null }),
      );
      expect(mail.sendPartnerInvitation).toHaveBeenCalledWith(
        'partner@example.com',
        expect.any(String),
        undefined,
      );
    });

    it('lève ConflictException si une invitation active existe déjà', async () => {
      repo.findByEmail.mockResolvedValue(makeInvitation());

      await expect(
        service.create({ email: 'partner@example.com' }, 'admin-id'),
      ).rejects.toThrow(ConflictException);
    });

    it('permet de créer une invitation si la précédente a été utilisée', async () => {
      repo.findByEmail.mockResolvedValue(makeInvitation({ used_at: new Date() }));
      repo.save.mockResolvedValue(makeInvitation({ id: 'inv-2' }));
      mail.sendPartnerInvitation.mockResolvedValue(undefined);

      const result = await service.create({ email: 'partner@example.com' }, 'admin-id');
      expect(result.id).toBe('inv-2');
    });

    it('permet de créer une invitation si la précédente est expirée', async () => {
      repo.findByEmail.mockResolvedValue(
        makeInvitation({ expires_at: new Date(Date.now() - 1000) }),
      );
      repo.save.mockResolvedValue(makeInvitation({ id: 'inv-2' }));
      mail.sendPartnerInvitation.mockResolvedValue(undefined);

      const result = await service.create({ email: 'partner@example.com' }, 'admin-id');
      expect(result.id).toBe('inv-2');
    });
  });

  describe('validateToken', () => {
    it("retourne l'invitation si le token est valide", async () => {
      const inv = makeInvitation();
      repo.findByToken.mockResolvedValue(inv);

      const result = await service.validateToken('valid-token');
      expect(result.id).toBe('inv-1');
    });

    it('lève NotFoundException si le token est inconnu', async () => {
      repo.findByToken.mockResolvedValue(null);

      await expect(service.validateToken('bad-token')).rejects.toThrow(NotFoundException);
    });

    it('lève ConflictException si le token a déjà été utilisé', async () => {
      repo.findByToken.mockResolvedValue(makeInvitation({ used_at: new Date() }));

      await expect(service.validateToken('valid-token')).rejects.toThrow(ConflictException);
    });

    it('lève BadRequestException si le token est expiré', async () => {
      repo.findByToken.mockResolvedValue(
        makeInvitation({ expires_at: new Date(Date.now() - 1000) }),
      );

      await expect(service.validateToken('valid-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('markAsUsed', () => {
    it("sauvegarde used_at sur l'invitation", async () => {
      repo.save.mockResolvedValue(makeInvitation({ used_at: new Date() }));

      await service.markAsUsed('inv-1');

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'inv-1', used_at: expect.any(Date) }),
      );
    });
  });
});

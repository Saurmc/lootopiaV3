import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InvitationsRepository } from './invitations.repository';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationEntity } from './entities/invitation.entity';
import { MailService } from '../mail/mail.service';

const INVITATION_TTL_HOURS = 72;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly mailService: MailService,
  ) {}

  async create(
    dto: CreateInvitationDto,
    createdById: string,
  ): Promise<{ id: string; email: string; expiresAt: Date }> {
    const existing = await this.invitationsRepository.findByEmail(dto.email);
    if (existing && !existing.used_at && existing.expires_at > new Date()) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);

    const invitation = await this.invitationsRepository.save({
      email: dto.email,
      token,
      partner_name: dto.partnerName ?? null,
      expires_at: expiresAt,
      used_at: null,
      created_by_id: createdById,
    });

    await this.mailService.sendPartnerInvitation(dto.email, token, dto.partnerName);

    return { id: invitation.id, email: invitation.email, expiresAt: invitation.expires_at };
  }

  findAll(): Promise<InvitationEntity[]> {
    return this.invitationsRepository.findAll();
  }

  async validateToken(token: string): Promise<InvitationEntity> {
    const invitation = await this.invitationsRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }
    if (invitation.used_at) {
      throw new ConflictException('This invitation has already been used');
    }
    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('This invitation has expired');
    }
    return invitation;
  }

  async markAsUsed(id: string): Promise<void> {
    await this.invitationsRepository.save({ id, used_at: new Date() });
  }
}

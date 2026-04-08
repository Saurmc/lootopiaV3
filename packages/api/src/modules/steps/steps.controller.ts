import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional-auth.guard';

@Controller('hunts/:huntId/steps')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  /**
   * GET /hunts/:huntId/steps — liste les étapes d'une chasse (public)
   */
  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  findAll(@Param('huntId') huntId: string) {
    return this.stepsService.findByHunt(huntId);
  }

  /**
   * POST /hunts/:huntId/steps — créer une étape (partenaire propriétaire ou admin)
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createStep(
    @Param('huntId') huntId: string,
    @Body() dto: CreateStepDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stepsService.createStep(huntId, user.id, dto);
  }

  /**
   * PATCH /hunts/:huntId/steps/:stepId — modifier une étape (partenaire propriétaire ou admin)
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Patch(':stepId')
  updateStep(
    @Param('huntId') huntId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateStepDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stepsService.updateStep(huntId, stepId, user.id, dto);
  }

  /**
   * DELETE /hunts/:huntId/steps/:stepId — supprimer une étape (partenaire propriétaire ou admin)
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Delete(':stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStep(
    @Param('huntId') huntId: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.stepsService.deleteStep(huntId, stepId, user.id);
  }
}

import {
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from './files.service';
import { StorageService } from './storage.service';
import { Auth } from '../../common/guards/auth-roles.guard';
import { Role } from '../../common/enums/role.enum';
import { ALLOWED_MIME_TYPES, MAX_SIZE_BYTES } from './files.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: StorageService,
  ) {}

  @Auth(Role.PLAYER, Role.PARTNER, Role.ADMIN)
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Type de fichier non autorisé. Formats acceptés : jpg, png, gif, webp, pdf'), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { id: string } },
    @Query('huntId') huntId?: string,
    @Query('stepId') stepId?: string,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');

    file.filename = `${uuidv4()}${extname(file.originalname).toLowerCase()}`;

    const key = await this.storageService.upload(req.user.id, file, huntId, stepId);
    const presignedUrl = await this.storageService.getPresignedUrl(key);

    return this.filesService.buildResult(file, key, presignedUrl);
  }

  // GET /files/presign?key=minio:partner-id/uuid.jpg
  @Auth(Role.PLAYER, Role.PARTNER, Role.ADMIN)
  @Get('presign')
  async presign(@Query('key') key: string) {
    if (!key) throw new BadRequestException('key requis');
    const url = await this.storageService.getPresignedUrl(key);
    return { url };
  }
}

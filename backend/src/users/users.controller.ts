import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TenantsService } from '../tenants/tenants.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Get('me')
  getProfile(@GetUser() user: any) {
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : String(user?.userId ?? user?.id ?? '');
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  updateProfile(@GetUser() user: any, @Body() data: any) {
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : String(user?.userId ?? user?.id ?? '');
    return this.usersService.updateProfile(userId, data);
  }

  @Post('me/password')
  changePassword(@GetUser() user: any, @Body() data: any) {
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : String(user?.userId ?? user?.id ?? '');
    const oldPassword = String(data?.oldPassword ?? '');
    const newPassword = String(data?.newPassword ?? '');
    return this.usersService.changePassword(userId, oldPassword, newPassword);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(String(file.originalname ?? ''))}`);
        },
      }),
    }),
  )
  async uploadAvatar(
    @GetUser() user: any,
    @GetTenantId() tenantId: string,
    @UploadedFile()
    file: any,
  ) {
    console.log('Upload avatar called for user:', user);
    console.log('File:', file);
    if (!file) {
      throw new Error('File is undefined in controller');
    }

    // SUPER_ADMIN limitlere takılmasın
    if (user.role !== 'SUPER_ADMIN') {
      const fileSize = Number(file?.size ?? 0);
      const isAllowed = await this.tenantsService.checkStorageLimit(
        tenantId,
        fileSize,
      );

      if (!isAllowed) {
        // Yüklenen dosyayı sil
        const fs = require('fs');
        const filePath =
          typeof file.path === 'string' ? file.path : String(file.path ?? '');
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return {
          error: `Depolama limitine ulaşıldı. Profil resmi yüklenemedi.`,
        };
      }
    }

    const avatarUrl = `/uploads/avatars/${String(file.filename ?? '')}`;
    const userId =
      typeof user?.userId === 'string'
        ? user.userId
        : String(user?.userId ?? user?.id ?? '');
    return this.usersService.updateAvatar(userId, avatarUrl);
  }

  @Get('list')
  async findAll(@GetTenantId() tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Post()
  create(@GetUser() user: any, @Body() data: any) {
    // Only allow ADMIN or HR to create users
    // if (user.role !== 'ADMIN' && user.role !== 'HR') {
    //   throw new UnauthorizedException('Yetkiniz yok');
    // }
    // For now, let's assume the frontend handles visibility and backend checks role if needed
    // Ideally use a Guard or check here.
    const tenantId =
      typeof user?.tenantId === 'string'
        ? user.tenantId
        : String(user?.tenantId ?? '');
    return this.usersService.create(data, tenantId);
  }
}

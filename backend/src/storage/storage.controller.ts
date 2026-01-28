import { Controller, Get, Post, Body, UseGuards, Query, UploadedFile, UseInterceptors, Delete, Param, Patch, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetUser } from '../common/decorators/user.decorator';
import type { Response } from 'express';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('file/:id/preview')
  async previewFile(@Param('id') fileId: string, @GetUser() user: any, @Res({ passthrough: true }) res: Response) {
    const { stream, mimeType, size, name } = await this.storageService.getFileStream(fileId, user);
    
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(name)}"`,
      'Content-Length': size,
    });
    
    return new StreamableFile(stream);
  }

  @Post('folder')
  createFolder(@Body() createFolderDto: CreateFolderDto, @GetUser() user: any) {
    return this.storageService.createFolder(createFolderDto, user.tenantId);
  }

  @Get('content')
  getContent(@Query('folderId') folderId: string, @GetUser() user: any) {
    return this.storageService.getFolderContents(folderId || null, user);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: any,
    @Body('folderId') folderId: string,
    @Body('isPublic') isPublic: string,
    @GetUser() user: any,
  ) {
    const isPublicBool = isPublic === 'true';
    return this.storageService.uploadFile(file, folderId || null, user, isPublicBool);
  }

  @Delete('file/:id')
  deleteFile(@Param('id') fileId: string, @GetUser() user: any) {
    return this.storageService.deleteFile(fileId, user);
  }

  @Delete('folder/:id')
  deleteFolder(@Param('id') folderId: string, @GetUser() user: any) {
    return this.storageService.deleteFolder(folderId, user);
  }

  @Patch('file/:id')
  updateFile(
    @Param('id') fileId: string,
    @Body('isPublic') isPublic: boolean,
    @GetUser() user: any,
  ) {
    return this.storageService.updateFile(fileId, isPublic, user);
  }

  @Post('file/:id/move')
  moveFile(
    @Param('id') fileId: string,
    @Body('targetFolderId') targetFolderId: string,
    @GetUser() user: any,
  ) {
      return this.storageService.moveFile(fileId, targetFolderId, user);
  }
}

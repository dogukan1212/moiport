import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { WordpressService } from './wordpress.service';
import { JwtAuthGuard, Public } from '../common/guards/auth.guard';
import { GetTenantId } from '../common/decorators/user.decorator';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { Response } from 'express';

@Controller('wordpress-sites')
export class WordpressController {
  constructor(private readonly wordpressService: WordpressService) {}

  @Public()
  @Get('download-plugin')
  downloadPlugin(@Res() res: Response) {
    // process.cwd() backend klasörüdür.
    // Dosya yolu: backend/plugins/moi-port.zip
    const filePath = join(process.cwd(), 'plugins', 'moi-port.zip');

    // Dosya var mı kontrol et
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).send('Plugin dosyası bulunamadı.');
    }

    return res.download(filePath, 'moi-port.zip', (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).send('Dosya indirilemedi.');
        }
      }
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@GetTenantId() tenantId: string) {
    return this.wordpressService.findAll(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.wordpressService.findOne(tenantId, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@GetTenantId() tenantId: string, @Body() data: any) {
    return this.wordpressService.create(tenantId, data);
  }

  @Get(':id/categories')
  @UseGuards(JwtAuthGuard)
  getCategories(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.wordpressService.getCategories(tenantId, id);
  }

  @Get(':id/kpi')
  @UseGuards(JwtAuthGuard)
  getKpi(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.wordpressService.getKpi(tenantId, id);
  }

  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  listPosts(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.wordpressService.listPosts(tenantId, id);
  }

  @Post(':id/posts')
  @UseGuards(JwtAuthGuard)
  createPost(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.wordpressService.createPost(tenantId, id, data);
  }

  @Patch(':id/posts/:postId')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Body() data: any,
  ) {
    return this.wordpressService.updatePost(tenantId, id, postId, data);
  }

  @Delete(':id/posts/:postId')
  @UseGuards(JwtAuthGuard)
  deletePost(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Param('postId') postId: string,
  ) {
    return this.wordpressService.deletePost(tenantId, id, postId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.wordpressService.update(tenantId, id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.wordpressService.delete(tenantId, id);
  }
}

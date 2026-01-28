import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';
import { ChatGateway } from './chat.gateway';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { TenantsService } from '../tenants/tenants.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly gateway: ChatGateway,
    private readonly tenantsService: TenantsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('rooms')
  listRooms(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Query('view') view?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.chatService.listRooms(tenantId, user, view, projectId);
  }

  @Post('rooms')
  async createRoom(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body()
    data: {
      name: string;
      type?: 'CHANNEL' | 'PROJECT' | 'DM';
      projectId?: string;
      isPrivate?: boolean;
      memberIds?: string[];
    },
  ) {
    const room = await this.chatService.createRoom(tenantId, user, data);
    this.gateway.emitRoomCreated(tenantId, room);
    return room;
  }

  @Get('rooms/:id/messages')
  listMessages(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') roomId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.listMessages(
      tenantId,
      user,
      roomId,
      cursor,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post('rooms/:id/messages')
  async sendMessage(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') roomId: string,
    @Body() body: { content: string; attachments?: any[] },
  ) {
    const msg = await this.chatService.sendMessage(
      tenantId,
      user,
      roomId,
      body.content,
      body.attachments,
    );
    this.gateway.emitMessageCreated(tenantId, roomId, msg);
    return msg;
  }

  @Post('rooms/:id/sync')
  async syncRoom(@GetTenantId() tenantId: string, @Param('id') roomId: string) {
    const messages = await this.chatService.syncInstagramMessages(
      tenantId,
      roomId,
    );
    if (messages && messages.length > 0) {
      // Emit update to refresh frontend
      // Assuming we can emit a 'room_updated' or just let frontend refetch
      // Actually, if we add new messages, we should emit them?
      // Or just return them and let frontend handle it.
      // But for consistency with other clients, let's emit.
      for (const msg of messages) {
        this.gateway.emitMessageCreated(tenantId, roomId, msg);
      }
    }
    return { count: messages?.length || 0 };
  }

  @Post('messages/:id/to-task')
  async messageToTask(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') messageId: string,
  ) {
    const task = await this.chatService.createTaskFromMessage(
      tenantId,
      user,
      messageId,
    );
    this.gateway.emitMessageToTask(tenantId, task);
    return task;
  }

  @Post('messages/:id/delete')
  async deleteMessage(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') messageId: string,
  ) {
    const msg = await this.chatService.deleteMessage(tenantId, user, messageId);
    this.gateway.emitMessageDeleted(tenantId, msg.roomId, msg);
    return msg;
  }

  @Get('users')
  listUsers(@GetTenantId() tenantId: string, @GetUser() user: any) {
    return this.chatService.listUsers(tenantId, user);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          try {
            const rawTenantId = req.user?.tenantId;
            const tenantId =
              typeof rawTenantId === 'string'
                ? rawTenantId
                : String(rawTenantId ?? '');
            const dir = path.join(
              process.cwd(),
              'uploads',
              tenantId || 'common',
            );
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
          } catch (e) {
            cb(e, undefined as any);
          }
        },
        filename: (req, file, cb) => {
          const originalName = String(file.originalname ?? '');
          const ext = path.extname(originalName);
          const base = path
            .basename(originalName, ext)
            .replace(/[^a-z0-9]+/gi, '-')
            .toLowerCase();
          const stamp = Date.now();
          cb(null, `${base}-${stamp}${ext}`);
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @GetUser() user: any,
    @GetTenantId() tenantId: string,
    @UploadedFile() file?: any,
  ) {
    if (!file) {
      return { error: 'Dosya bulunamadı' };
    }

    // SUPER_ADMIN limitlere takılmasın
    if (user.role !== 'SUPER_ADMIN') {
      const fileSize = Number(file.size || 0);
      const isAllowed = await this.tenantsService.checkStorageLimit(
        tenantId,
        fileSize,
      );

      if (!isAllowed) {
        // Yüklenen dosyayı sil (multer zaten kaydetti)
        const filePath =
          typeof file.path === 'string' ? file.path : String(file.path ?? '');
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return {
          error: `Depolama limitine ulaşıldı. Lütfen paketinizi yükseltin.`,
        };
      }
    }

    const rel = `/uploads/${tenantId}/${file.filename}`;
    return {
      url: rel,
      name: file.originalname,
      size: Number(file.size || 0),
      mime: file.mimetype,
    };
  }
}

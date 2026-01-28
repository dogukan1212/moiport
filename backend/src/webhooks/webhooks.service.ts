import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { CrmGateway } from '../crm/crm.gateway';
import { FacebookService } from '../integrations/facebook/facebook.service';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private crmGateway: CrmGateway,
    private facebookService: FacebookService,
  ) {}

  async handleMetaPayload(payload: any) {
    // Check if it's an Instagram event
    if (payload.object === 'instagram') {
      for (const entry of payload.entry) {
        const instagramBusinessId = entry.id;

        // 1. Handle Messages (DMs)
        if (entry.messaging) {
          for (const event of entry.messaging) {
            await this.handleInstagramMessage(event, instagramBusinessId);
          }
        }

        // 2. Handle Changes (Comments, etc.)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              await this.handleInstagramComment(
                change.value,
                instagramBusinessId,
              );
            }
          }
        }
      }
    }

    // Check if it's a Facebook Page event (Facebook DM)
    if (payload.object === 'page') {
      for (const entry of payload.entry) {
        const pageId = entry.id;

        // 1. Handle Messages (DMs)
        if (entry.messaging) {
          for (const event of entry.messaging) {
            // Re-use Instagram logic but for Facebook (logic is identical for DMs)
            // We just need to make sure we find the tenant by pageId
            await this.handleFacebookMessage(event, pageId);
          }
        }

        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'leadgen') {
              await this.handleFacebookLeadgen(change.value);
            }
          }
        }
      }
    }

    // Check if it's a WhatsApp Business Account event
    if (payload.object === 'whatsapp_business_account') {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            await this.handleWhatsAppMessage(change.value);
          }
        }
      }
    }

    return { status: 'success' };
  }

  private async handleWhatsAppMessage(value: any) {
    const phoneNumberId = value.metadata.phone_number_id;
    const messages = value.messages;
    const contacts = value.contacts;

    // Find config by phoneNumberId
    const config = await this.prisma.whatsappConfig.findFirst({
      where: { phoneNumberId },
      include: { tenant: true },
    });

    if (!config) {
      console.log(
        `[Webhooks] No config found for WhatsApp Phone Number ID: ${phoneNumberId}`,
      );
      return;
    }

    const tenantId = config.tenantId;

    for (const message of messages) {
      // Ignore status updates or system messages for now
      if (message.type === 'system') continue;

      const from = message.from; // Phone number
      const contactName =
        contacts?.find((c: any) => c.wa_id === from)?.profile?.name || from;

      let content = '';
      if (message.type === 'text') {
        content = message.text.body;
      } else if (message.type === 'image') {
        content = '[Resim]'; // Link handling requires media download which is complex
      } else if (message.type === 'document') {
        content = '[Belge]';
      } else {
        content = `[${message.type}]`;
      }

      // Find or Create Lead
      // Note: We need to inject CrmService logic here or use Prisma directly
      // Since CrmService is in another module, we can use Prisma but better to reuse logic if possible.
      // But we are in WebhooksService.

      let lead = await this.prisma.lead.findFirst({
        where: {
          tenantId,
          phone: { contains: from }, // Simple match, might need normalization
        },
        include: { pipeline: true },
      });

      if (!lead) {
        // Create new lead
        // Determine pipeline
        let pipeline;
        if (config.customerId) {
          pipeline = await this.prisma.pipeline.findFirst({
            where: { tenantId, customerId: config.customerId },
          });

          if (!pipeline) {
            // Create a pipeline for this customer if not exists
            pipeline = await this.prisma.pipeline.create({
              data: {
                name: 'WhatsApp Pipeline',
                tenantId,
                customerId: config.customerId,
                stages: {
                  create: [
                    { name: 'Yeni', order: 1 },
                    { name: 'İşleniyor', order: 2 },
                    { name: 'Tamamlandı', order: 3 },
                  ],
                },
              },
              include: { stages: true },
            });
          }
        } else {
          // Agency default pipeline
          pipeline = await this.prisma.pipeline.findFirst({
            where: { tenantId, customerId: null },
            orderBy: { createdAt: 'asc' },
          });

          if (!pipeline) {
            // Should exist but just in case
            pipeline = await this.prisma.pipeline.create({
              data: {
                name: 'Genel Pipeline',
                tenantId,
                stages: {
                  create: [{ name: 'Yeni', order: 1 }],
                },
              },
              include: { stages: true },
            });
          }
        }

        // Get first stage
        const stage = await this.prisma.stage.findFirst({
          where: { pipelineId: pipeline.id },
          orderBy: { order: 'asc' },
        });

        lead = await this.prisma.lead.create({
          data: {
            name: contactName,
            phone: from,
            source: 'WHATSAPP',
            tenantId,
            pipelineId: pipeline.id,
            stageId: stage!.id,
            customerId: config.customerId, // Link to customer if applicable
          },
          include: { pipeline: true },
        });

        this.crmGateway.emitLeadCreated(tenantId, lead);
      }

      // Add Activity
      const activity = await this.prisma.crmActivity.create({
        data: {
          type: 'WHATSAPP_IN',
          content,
          leadId: lead.id,
          tenantId,
          externalId: message.id,
          status: 'DELIVERED',
        },
      });

      // Update Lead updatedAt
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { updatedAt: new Date() },
      });

      this.crmGateway.emitWhatsappMessage(tenantId, {
        leadId: lead.id,
        activity,
        lead,
      });
    }
  }

  private async handleFacebookLeadgen(value: any) {
    const leadgenId = value?.leadgen_id;
    const formId = value?.form_id;
    const pageId = value?.page_id;

    if (!leadgenId || !formId || !pageId) {
      return;
    }

    try {
      await this.facebookService.importLeadFromWebhook(
        pageId,
        formId,
        leadgenId,
      );
    } catch (error: any) {
      console.error(
        'Facebook leadgen webhook error:',
        error.response?.data || error.message,
      );
    }
  }

  private async handleFacebookMessage(event: any, pageId: string) {
    const senderId = event.sender.id;
    const message = event.message;

    if (message.is_echo) return;

    // Find Tenant by pageId
    const fbConfig = await this.prisma.facebookConfig.findFirst({
      where: { pageId: pageId },
    });

    if (!fbConfig) {
      console.log(`No tenant found for Facebook Page ID: ${pageId}`);
      return;
    }

    const tenantId = fbConfig.tenantId;

    // Find/Create Visitor User
    let visitor = await this.prisma.user.findFirst({
      where: {
        email: `fb_${senderId}@facebook.placeholder`,
        tenantId: tenantId,
      },
    });

    if (!visitor) {
      visitor = await this.prisma.user.create({
        data: {
          email: `fb_${senderId}@facebook.placeholder`,
          name: 'Facebook Kullanıcısı',
          role: 'CLIENT',
          tenantId: tenantId,
          avatar: null,
          password: await import('bcrypt').then((b) =>
            b.hash('facebook_user', 10),
          ),
        },
      });
    }

    // Find/Create Room
    let room = await this.prisma.chatRoom.findFirst({
      where: {
        tenantId: tenantId,
        platform: 'FACEBOOK', // We can distinguish or use INSTAGRAM/FACEBOOK generic
        externalId: senderId,
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          name: visitor.name || 'Facebook Chat',
          type: 'DM',
          platform: 'FACEBOOK', // Make sure to handle this enum/string in frontend
          externalId: senderId,
          tenantId: tenantId,
          memberships: {
            create: [{ userId: visitor.id, tenantId: tenantId }],
          },
        },
      });
    }

    // Create Message
    const newMessage = await this.prisma.chatMessage.create({
      data: {
        roomId: room.id,
        userId: visitor.id,
        tenantId: tenantId,
        content:
          message.text || (message.attachments ? 'Medya gönderildi' : ''),
        platform: 'FACEBOOK',
        externalId: message.mid,
        status: 'DELIVERED',
      },
    });

    await this.prisma.chatRoom.update({
      where: { id: room.id },
      data: { updatedAt: new Date() },
    });

    this.chatGateway.server
      .to(`tenant:${tenantId}`)
      .emit('message', newMessage);
  }

  async handleWasenderPayload(payload: any) {
    const event = payload?.event;
    const data = payload?.data || {};

    if (!event) {
      return { status: 'ignored' };
    }

    if (event === 'messages.upsert' || event === 'messages.received') {
      const rawMessages = data.messages;
      const messages = Array.isArray(rawMessages)
        ? rawMessages
        : rawMessages
          ? [rawMessages]
          : [];

      if (!messages.length) {
        return { status: 'ignored' };
      }

      const first = messages[0] || {};
      const key = first.key || {};
      const message = first.message || {};

      if (key.fromMe) {
        return { status: 'ignored' };
      }

      let from: string | undefined =
        key.cleanedSenderPn ||
        key.senderPn ||
        key.remoteJid ||
        data.from ||
        data.chatId ||
        data.remoteJid;

      if (!from) {
        return { status: 'ignored' };
      }

      if (from.includes('@')) {
        from = from.split('@')[0];
      }

      let content = first.messageBody || '';
      if (!content) {
        if (message.conversation) {
          content = message.conversation;
        } else if (message.extendedTextMessage?.text) {
          content = message.extendedTextMessage.text;
        } else {
          content = '[Mesaj]';
        }
      }

      const config = await this.prisma.whatsappConfig.findFirst({
        where: { provider: 'wasender', isActive: true },
        include: { tenant: true },
      });

      if (!config) {
        return { status: 'no-config' };
      }

      const tenantId = config.tenantId;

      let lead = await this.prisma.lead.findFirst({
        where: {
          tenantId,
          phone: { contains: from },
        },
        include: { pipeline: true },
      });

      if (!lead) {
        let pipeline;
        if (config.customerId) {
          pipeline = await this.prisma.pipeline.findFirst({
            where: { tenantId, customerId: config.customerId },
          });

          if (!pipeline) {
            pipeline = await this.prisma.pipeline.create({
              data: {
                name: 'WhatsApp Pipeline',
                tenantId,
                customerId: config.customerId,
                stages: {
                  create: [
                    { name: 'Yeni', order: 1 },
                    { name: 'İşleniyor', order: 2 },
                    { name: 'Tamamlandı', order: 3 },
                  ],
                },
              },
              include: { stages: true },
            });
          }
        } else {
          pipeline = await this.prisma.pipeline.findFirst({
            where: { tenantId, customerId: null },
            orderBy: { createdAt: 'asc' },
          });

          if (!pipeline) {
            pipeline = await this.prisma.pipeline.create({
              data: {
                name: 'Genel Pipeline',
                tenantId,
                stages: {
                  create: [{ name: 'Yeni', order: 1 }],
                },
              },
              include: { stages: true },
            });
          }
        }

        const stage = await this.prisma.stage.findFirst({
          where: { pipelineId: pipeline.id },
          orderBy: { order: 'asc' },
        });

        lead = await this.prisma.lead.create({
          data: {
            name: from,
            phone: from,
            source: 'WHATSAPP',
            tenantId,
            pipelineId: pipeline.id,
            stageId: stage!.id,
            customerId: config.customerId,
          },
          include: { pipeline: true },
        });

        this.crmGateway.emitLeadCreated(tenantId, lead);
      }

      const activity = await this.prisma.crmActivity.create({
        data: {
          type: 'WHATSAPP_IN',
          content,
          leadId: lead.id,
          tenantId,
          externalId: key.id,
          status: 'DELIVERED',
        },
      });

      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { updatedAt: new Date() },
      });

      this.crmGateway.emitWhatsappMessage(tenantId, {
        leadId: lead.id,
        activity,
        lead,
      });

      return { status: 'success' };
    }

    return { status: 'ignored' };
  }

  private async handleInstagramMessage(event: any, businessId: string) {
    const senderId = event.sender.id;
    const recipientId = event.recipient.id;
    const message = event.message;

    // Ignore messages sent by the page itself (echo)
    if (message.is_echo) return;

    // Find or create the ChatRoom
    // We need to find which tenant owns this Instagram Business Account
    // This requires a lookup in FacebookConfig
    const config = await this.prisma.facebookConfig.findFirst({
      where: {
        // We need to match businessId.
        // Since we might not store all page IDs in config directly or user might have multiple pages,
        // we should ideally store connected pages.
        // For now, let's assume we find it via pageId or we search all configs (inefficient but works for MVP)
        // Or better: We added `instagramBusinessAccountId` to FacebookConfig schema earlier?
        // Let's check schema.
      },
    });

    // Wait, I need to know which tenant this message belongs to.
    // In a real multi-tenant app, we should store `instagramBusinessAccountId` in `FacebookConfig` or a related table.
    // Let's check `FacebookConfig` in schema again.

    /* 
      model FacebookConfig {
        id             String   @id @default(uuid())
        tenantId       String   @unique
        ...
        pageId         String?
        instagramBusinessAccountId String? // I added this previously? Let's verify.
      }
    */

    // Assuming I have access to tenant via the config.
    // Since I can't easily query by `instagramBusinessAccountId` if it's not unique or indexed properly yet,
    // I will try to find the config where `instagramBusinessAccountId` matches or just use a fallback.

    // Fallback: If we don't have the mapping, we can't assign it to a tenant.
    // For this specific user, we know the tenant exists.

    // Let's create the room/message first.

    /*
      LOGIC:
      1. Find Tenant by `instagramBusinessAccountId` (businessId).
      2. Find/Create User (Visitor) by `senderId`.
      3. Find/Create ChatRoom.
      4. Create ChatMessage.
      5. Emit Socket Event.
    */

    // STEP 1: Find Tenant
    // We search for the configuration that matches this Instagram Business Account ID
    const fbConfig = await this.prisma.facebookConfig.findFirst({
      where: { instagramBusinessAccountId: businessId },
    });

    if (!fbConfig) {
      console.warn(
        `[Webhooks] Tenant not found for Instagram Business ID: ${businessId}. Ensure the user has connected their Instagram account in Settings.`,
      );
      return;
    }

    const tenantId = fbConfig.tenantId;
    console.log(
      `[Webhooks] Processing Instagram message for Tenant: ${tenantId} (IG: ${businessId})`,
    );

    // STEP 2: Find/Create Visitor User
    // We don't have their real name/email yet unless we query IG Profile API.
    // For now, use a placeholder or generic name.
    let visitor = await this.prisma.user.findFirst({
      where: {
        email: `ig_${senderId}@instagram.placeholder`, // Fake email to satisfy unique constraint
        tenantId: tenantId,
      },
    });

    if (!visitor) {
      visitor = await this.prisma.user.create({
        data: {
          email: `ig_${senderId}@instagram.placeholder`,
          name: 'Instagram Kullanıcısı', // We can update this later via API
          role: 'CLIENT',
          tenantId: tenantId,
          avatar: null, // Can fetch from API later
          password: await import('bcrypt').then((b) =>
            b.hash('instagram_user', 10),
          ),
        },
      });
    }

    // STEP 3: Find/Create Room
    let room = await this.prisma.chatRoom.findFirst({
      where: {
        tenantId: tenantId,
        platform: 'INSTAGRAM',
        externalId: senderId, // We use senderId (IG User ID) as externalId for DM room
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          name: visitor.name || 'Instagram Chat',
          type: 'DM',
          platform: 'INSTAGRAM',
          externalId: senderId,
          tenantId: tenantId,
          memberships: {
            create: [
              { userId: visitor.id, tenantId: tenantId },
              // We can add agents later or they are auto-added when they reply
            ],
          },
        },
      });
    }

    // STEP 4: Create Message
    const newMessage = await this.prisma.chatMessage.create({
      data: {
        roomId: room.id,
        userId: visitor.id,
        tenantId: tenantId,
        content:
          message.text || (message.attachments ? 'Medya gönderildi' : ''),
        platform: 'INSTAGRAM',
        externalId: message.mid,
        status: 'DELIVERED',
      },
    });

    // Update Room
    await this.prisma.chatRoom.update({
      where: { id: room.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // STEP 5: Emit Socket
    this.chatGateway.server
      .to(`tenant:${tenantId}`)
      .emit('message', newMessage);
  }

  private async handleInstagramComment(comment: any, businessId: string) {
    // Similar logic for comments
    // Comments usually are treated as "Channels" or "Threads" per Post?
    // Or just a single room for "Comments"?
    // User requested "Comments" tab.

    const fbConfig = await this.prisma.facebookConfig.findFirst({
      where: { instagramBusinessAccountId: businessId },
    });

    if (!fbConfig) {
      console.warn(
        `[Webhooks] Tenant not found for Instagram Comment (IG ID: ${businessId})`,
      );
      return;
    }
    const tenantId = fbConfig.tenantId;

    const senderId = comment.from.id;
    const username = comment.from.username;

    // Find/Create User
    let visitor = await this.prisma.user.findFirst({
      where: { email: `ig_${senderId}@instagram.placeholder`, tenantId },
    });

    if (!visitor) {
      visitor = await this.prisma.user.create({
        data: {
          email: `ig_${senderId}@instagram.placeholder`,
          name: username || 'Instagram Kullanıcısı',
          role: 'CLIENT',
          tenantId: tenantId,
          password: await import('bcrypt').then((b) =>
            b.hash('instagram_user', 10),
          ),
        },
      });
    }

    // Find/Create Room (One room per Post?)
    // For simplicity, let's make one room per Post ID.
    // Or if we don't have post ID in this specific payload (sometimes it's in parent_id),
    // we can group all comments in one "General Comments" or per user.
    // Let's assume we want to group by Post if possible.
    // The comment object has `media` field sometimes containing media ID.
    // Let's use `comment.media.id` if available, or just create a room for the user.

    // Let's stick to the User-based room for now to keep it consistent with DMs,
    // BUT type = 'CHANNEL' as per my previous frontend logic for "Comments" tab.
    // Actually, for comments, it's better to show "Post: XYZ" as room name.

    // Let's assume payload has `media` -> `id`.
    const mediaId = comment.media?.id || 'unknown_media';

    let room = await this.prisma.chatRoom.findFirst({
      where: {
        tenantId,
        platform: 'INSTAGRAM',
        externalId: mediaId,
        type: 'CHANNEL',
      },
    });

    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          name: `Gönderi: ${mediaId.substring(0, 10)}...`,
          type: 'CHANNEL',
          platform: 'INSTAGRAM',
          externalId: mediaId,
          tenantId,
          memberships: {
            create: [{ userId: visitor.id, tenantId: tenantId }],
          },
        },
      });
    }

    const newMessage = await this.prisma.chatMessage.create({
      data: {
        roomId: room.id,
        userId: visitor.id,
        tenantId,
        content: comment.text,
        platform: 'INSTAGRAM',
        externalId: comment.id,
        status: 'DELIVERED',
      },
    });

    await this.prisma.chatRoom.update({
      where: { id: room.id },
      data: { updatedAt: new Date() },
    });

    this.chatGateway.server
      .to(`tenant:${tenantId}`)
      .emit('message', newMessage);
  }
}

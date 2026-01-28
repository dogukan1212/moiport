import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

type TrelloConfigShape = {
  apiKey: string;
  token: string;
};

@Injectable()
export class TrelloService {
  constructor(private readonly prisma: PrismaService) {}

  private trelloErrorToMessage(error: any): string {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (data && typeof data === 'object') {
      const msg = data.message || data.error || data.errors || undefined;
      if (msg) return String(msg);
    }
    if (typeof data === 'string' && data.trim()) return data;
    if (status === 401)
      return 'Trello kimlik doğrulaması başarısız. API Key/Token kontrol edin.';
    if (status === 404)
      return 'Trello kaynağı bulunamadı (board/list id yanlış olabilir).';
    return String(error?.message || 'Trello isteği başarısız.');
  }

  private async getActiveCredentials(
    tenantId: string,
  ): Promise<TrelloConfigShape> {
    let config: any = null;
    try {
      config = await this.prisma.trelloConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }

    const apiKey = String(config?.apiKey || '').trim();
    const token = String(config?.token || '').trim();
    const isActive = !!config?.isActive;
    if (!isActive) {
      throw new BadRequestException(
        'Trello entegrasyonu aktif değil. Lütfen aktif edip kaydedin.',
      );
    }
    if (!apiKey || !token) {
      throw new BadRequestException(
        'Trello entegrasyonu için API Key ve Token girilmelidir.',
      );
    }
    return { apiKey, token };
  }

  private trelloApi() {
    return axios.create({
      baseURL: 'https://api.trello.com/1',
      timeout: 30_000,
    });
  }

  async testAuth(tenantId: string) {
    const { apiKey, token } = await this.getActiveCredentials(tenantId);
    const api = this.trelloApi();
    try {
      const res = await api.get('/members/me', {
        params: {
          key: apiKey,
          token,
          fields: 'id,username,fullName',
        },
      });
      const data = res?.data || {};
      return {
        ok: true,
        member: {
          id: data?.id || null,
          username: data?.username || null,
          fullName: data?.fullName || null,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(this.trelloErrorToMessage(error));
    }
  }

  async getConfig(tenantId: string) {
    let db: any = null;
    try {
      db = await this.prisma.trelloConfig.findFirst({ where: { tenantId } });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        return { tenantId, apiKey: null, token: null, isActive: false };
      }
      throw error;
    }

    if (!db) {
      return { tenantId, apiKey: null, token: null, isActive: false };
    }
    return db;
  }

  async updateConfig(
    tenantId: string,
    data: { apiKey?: string | null; token?: string | null; isActive?: boolean },
  ) {
    let existing: any = null;
    try {
      existing = await this.prisma.trelloConfig.findFirst({
        where: { tenantId },
      });
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('no such table')) {
        throw new BadRequestException(
          'Veritabanı güncel değil. Lütfen migration işlemlerini çalıştırın.',
        );
      }
      throw error;
    }

    const isActive =
      typeof data.isActive === 'boolean'
        ? data.isActive
        : (existing?.isActive ?? false);

    const effectiveApiKey = String(
      data.apiKey !== undefined ? data.apiKey : existing?.apiKey || '',
    ).trim();
    const effectiveToken = String(
      data.token !== undefined ? data.token : existing?.token || '',
    ).trim();
    if (isActive && (!effectiveApiKey || !effectiveToken)) {
      throw new BadRequestException(
        'Trello entegrasyonunu aktif etmek için API Key ve Token zorunludur.',
      );
    }

    if (existing) {
      return this.prisma.trelloConfig.update({
        where: { id: existing.id },
        data: {
          apiKey: data.apiKey !== undefined ? data.apiKey : existing.apiKey,
          token: data.token !== undefined ? data.token : existing.token,
          isActive,
        },
      });
    }

    return this.prisma.trelloConfig.create({
      data: {
        tenantId,
        apiKey: data.apiKey ?? null,
        token: data.token ?? null,
        isActive,
      },
    });
  }

  async listBoards(tenantId: string) {
    const { apiKey, token } = await this.getActiveCredentials(tenantId);
    const api = this.trelloApi();
    try {
      const res = await api.get('/members/me/boards', {
        params: {
          key: apiKey,
          token,
          filter: 'open',
          fields: 'name,url,closed',
        },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error: any) {
      throw new BadRequestException(this.trelloErrorToMessage(error));
    }
  }

  async listBoardLists(tenantId: string, boardId: string) {
    const { apiKey, token } = await this.getActiveCredentials(tenantId);
    const api = this.trelloApi();
    try {
      const res = await api.get(
        `/boards/${encodeURIComponent(boardId)}/lists`,
        {
          params: {
            key: apiKey,
            token,
            fields: 'name,closed',
          },
        },
      );
      return Array.isArray(res.data) ? res.data : [];
    } catch (error: any) {
      throw new BadRequestException(this.trelloErrorToMessage(error));
    }
  }

  private isAllowedStatus(value: string) {
    const v = String(value || '').trim();
    if (!v) return false;
    if (v.length > 128) return false;
    if (v.toUpperCase() === 'ARCHIVED') return false;
    return true;
  }

  async importBoardToProject(
    tenantId: string,
    body: {
      boardId: string;
      projectId?: string;
      customerId?: string;
      projectName?: string;
      listStatusMap: Record<string, string>;
    },
  ) {
    const boardId = String(body?.boardId || '').trim();
    if (!boardId) throw new BadRequestException('boardId zorunludur.');

    const { apiKey, token } = await this.getActiveCredentials(tenantId);
    const api = this.trelloApi();

    let projectId: string | null = String(body?.projectId || '').trim() || null;
    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
      });
      if (!project) throw new NotFoundException('Proje bulunamadı.');
    } else {
      const customerId = String(body?.customerId || '').trim() || null;
      if (customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: { id: customerId, tenantId },
          select: { id: true },
        });
        if (!customer) throw new NotFoundException('Müşteri bulunamadı.');

        let boardName = '';
        try {
          const boardRes = await api.get(
            `/boards/${encodeURIComponent(boardId)}`,
            {
              params: { key: apiKey, token, fields: 'name' },
            },
          );
          boardName = String(boardRes?.data?.name || '').trim();
        } catch (error: any) {
          throw new BadRequestException(this.trelloErrorToMessage(error));
        }
        const projectName =
          String(body?.projectName || '').trim() ||
          boardName ||
          'Trello Projesi';

        const created = await this.prisma.project.create({
          data: {
            tenantId,
            customerId,
            name: projectName,
            description: 'Trello import',
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        projectId = created.id;
      }
    }

    let lists: any[] = [];
    try {
      const listsRes = await api.get(
        `/boards/${encodeURIComponent(boardId)}/lists`,
        {
          params: { key: apiKey, token, fields: 'name,closed' },
        },
      );
      lists = Array.isArray(listsRes.data) ? listsRes.data : [];
    } catch (error: any) {
      throw new BadRequestException(this.trelloErrorToMessage(error));
    }
    const activeLists = lists.filter((l) => !l?.closed);
    const listMap: Record<string, { id: string; name: string }> = {};
    for (const l of activeLists) {
      if (l?.id) listMap[l.id] = { id: l.id, name: String(l?.name || '') };
    }

    let cards: any[] = [];
    try {
      const cardsRes = await api.get(
        `/boards/${encodeURIComponent(boardId)}/cards`,
        {
          params: {
            key: apiKey,
            token,
            filter: 'open',
            fields: 'name,desc,idList,due,idMembers,labels',
          },
        },
      );
      cards = Array.isArray(cardsRes.data) ? cardsRes.data : [];
    } catch (error: any) {
      throw new BadRequestException(this.trelloErrorToMessage(error));
    }

    const orderStep = 1024;
    const nextOrderByStatus = new Map<string, number>();
    const nextOrder = (status: string) => {
      const cur = nextOrderByStatus.get(status) ?? orderStep;
      nextOrderByStatus.set(status, cur + orderStep);
      return cur;
    };

    const normalizeMapping = (listId: string) => {
      const mappedRaw = String(body?.listStatusMap?.[listId] || '').trim();
      const mappedLower = mappedRaw.toLowerCase();

      if (mappedLower.startsWith('assignee:')) {
        const assigneeId = mappedRaw.slice('assignee:'.length).trim();
        if (assigneeId && assigneeId !== 'unassigned') {
          return { status: 'TODO', assigneeId };
        }
        return { status: 'TODO' };
      }

      if (mappedRaw && this.isAllowedStatus(mappedRaw))
        return { status: mappedRaw };
      return { status: 'TODO' };
    };

    const tasksToCreate = cards
      .filter((c) => c?.id && c?.idList && listMap[c.idList])
      .map((c) => {
        const mapping = normalizeMapping(String(c.idList));
        const status = mapping.status;
        const labels = Array.isArray(c.labels)
          ? c.labels.map((l: any) => ({
              id: l?.id,
              name: l?.name,
              color: l?.color,
            }))
          : [];
        const members = Array.isArray(c.idMembers) ? c.idMembers : [];
        const dueDate = c?.due ? new Date(c.due) : null;
        return {
          tenantId,
          projectId: projectId ?? null,
          title: String(c.name || '').trim() || 'İsimsiz Kart',
          description: String(c.desc || '').trim() || null,
          status,
          assigneeId: mapping.assigneeId ?? null,
          order: nextOrder(status),
          dueDate,
          labels: labels.length ? JSON.stringify(labels) : null,
          members: members.length ? JSON.stringify(members) : null,
          memberCount: members.length,
        };
      });

    if (tasksToCreate.length === 0) {
      return {
        projectId: projectId ?? null,
        createdTaskCount: 0,
        skippedCardCount: cards.length,
        lists: activeLists.map((l) => ({ id: l.id, name: l.name })),
      };
    }

    const created = await this.prisma.task.createMany({
      data: tasksToCreate as any,
    });

    const listSummary = activeLists.map((l) => ({
      id: l.id,
      name: l.name,
      mappedStatus: this.isAllowedStatus(
        String(body?.listStatusMap?.[l.id] || ''),
      )
        ? String(body?.listStatusMap?.[l.id])
        : null,
    }));

    return {
      projectId: projectId ?? null,
      createdTaskCount: created.count,
      skippedCardCount: cards.length - tasksToCreate.length,
      lists: listSummary,
    };
  }
}

import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AIService } from './ai.service';
import { PexelsService } from './pexels.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId } from '../common/decorators/user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly pexelsService: PexelsService,
  ) {}

  @Post('suggest-images')
  async suggestImages(
    @Body('query') query: string,
    @Body('perPage') perPage?: number,
    @Body('locale') locale?: string,
  ) {
    return this.pexelsService.searchPhotos(query, perPage, locale);
  }

  @Post('analyze-sector')
  async analyzeSector(
    @GetTenantId() tenantId: string,
    @Body('sector') sector: string,
    @Body('customerUrl') customerUrl?: string,
    @Body('customerIg') customerIg?: string,
    @Body('deepSearch') deepSearch?: boolean,
  ) {
    return this.aiService.analyzeSector(
      tenantId,
      sector,
      customerUrl,
      customerIg,
      deepSearch,
    );
  }

  @Post('generate-prompt')
  async generateSmartPrompt(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      sector: string;
      type: string;
      topic: string;
      context?: string;
      aiModel?: string;
    },
  ) {
    return this.aiService.generateSmartPrompt(tenantId, data);
  }

  @Post('analyze-site')
  async analyzeSite(
    @GetTenantId() tenantId: string,
    @Body('url') url: string,
    @Body('deepSearch') deepSearch?: boolean,
    @Body('siteId') siteId?: string,
  ) {
    return this.aiService.analyzeSite(tenantId, url, deepSearch, siteId);
  }

  @Post('suggest-titles')
  async suggestTitles(
    @GetTenantId() tenantId: string,
    @Body() data: { topic: string; context?: string; aiModel?: string },
  ) {
    return this.aiService.suggestTitles(tenantId, data);
  }

  @Post('generate-content')
  async generateContent(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      type: string;
      topic: string;
      sector: string;
      customerUrl?: string;
      customerIg?: string;
      context?: string;
      tone?: string;
      aiModel?: string;
    },
  ) {
    return this.aiService.generateContent(tenantId, data);
  }

  @Post('generate-proposal')
  async generateProposal(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      clientName: string;
      projectScope: string;
      sector: string;
      timeline?: string;
      goals?: string;
      deepSearch?: boolean;
      customerWebsite?: string;
      selectedServices?: any[];
      aiModel?: string;
    },
  ) {
    return this.aiService.generateProposal(tenantId, data);
  }

  @Post('finance/insights')
  async financeInsights(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      aiModel?: string;
      preferredCurrency?: string;
    },
    @Body('options') options?: any,
    @Body('context') context?: any,
  ) {
    return this.aiService.financeInsights(tenantId, data, options, context);
  }

  @Post('finance/qa')
  async financeQA(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      question: string;
      aiModel?: string;
      preferredCurrency?: string;
    },
    @Body('options') options?: any,
    @Body('context') context?: any,
  ) {
    return this.aiService.financeQA(tenantId, data, options, context);
  }

  @Get('test-connection')
  async testConnection() {
    return this.aiService.testGemini();
  }

  @Post('whatsapp/smart-replies')
  async whatsappSmartReplies(
    @GetTenantId() tenantId: string,
    @Body('messages') messages: string[],
    @Body('aiModel') aiModel?: string,
  ) {
    const replies = await this.aiService.generateSmartReplies(
      Array.isArray(messages) ? messages : [],
    );
    return { replies };
  }
}

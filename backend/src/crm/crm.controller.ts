import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreatePipelineDto } from './dto/create-pipeline.dto';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  private ensureCrmAccess(user: any) {
    if (user?.role !== 'CLIENT') return;
    const modules = (user?.allowedModules || '')
      .split(',')
      .map((module: string) => module.trim())
      .filter(Boolean);
    if (!modules.includes('CRM')) {
      throw new ForbiddenException('CRM erişiminiz yok.');
    }
  }

  // Pipelines
  @Post('pipelines')
  createPipeline(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: CreatePipelineDto,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.createPipeline(tenantId, data);
  }

  @Get('pipelines')
  findAllPipelines(@GetTenantId() tenantId: string, @GetUser() user: any) {
    this.ensureCrmAccess(user);
    return this.crmService.findAllPipelines(tenantId, user);
  }

  @Get('pipelines/:id')
  findPipeline(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.findPipeline(tenantId, id, user);
  }

  @Delete('pipelines/:id')
  deletePipeline(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.deletePipeline(tenantId, id);
  }

  // Stages
  @Post('stages')
  createStage(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: { pipelineId: string; name: string; color?: string },
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.createStage(tenantId, data.pipelineId, data);
  }

  @Patch('stages/:id')
  updateStage(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: { name?: string; color?: string; order?: number },
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.updateStage(tenantId, id, data);
  }

  @Delete('stages/:id')
  deleteStage(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.deleteStage(tenantId, id);
  }

  // Leads
  @Post('leads')
  createLead(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: CreateLeadDto,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.createLead(tenantId, data);
  }

  @Get('leads')
  findAllLeads(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Query('pipelineId') pipelineId?: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.findAllLeads(tenantId, user, pipelineId);
  }

  @Get('whatsapp-conversations')
  findWhatsappConversations(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Query('includeArchived') includeArchived?: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.findWhatsappConversations(
      tenantId,
      user,
      includeArchived === 'true',
    );
  }

  @Get('leads/:id')
  findLead(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.findLead(tenantId, id);
  }

  @Patch('leads/:id')
  updateLead(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.updateLead(tenantId, id, data);
  }

  @Patch('leads/:id/assignee')
  assignLead(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body('assigneeId') assigneeId?: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.assignLead(
      tenantId,
      id,
      assigneeId ? String(assigneeId) : null,
    );
  }

  @Patch('leads/:id/move')
  moveLead(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') leadId: string,
    @Body('stageId') stageId: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.moveLead(tenantId, leadId, stageId);
  }

  @Delete('leads/:id')
  deleteLead(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.deleteLead(tenantId, id);
  }

  @Patch('leads/:id/archive')
  setWhatsappConversationArchived(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') leadId: string,
    @Body('archived') archived: boolean,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.setWhatsappConversationArchived(
      tenantId,
      leadId,
      archived,
    );
  }

  // Activities
  @Post('leads/:id/activities')
  addActivity(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @GetUser('userId') userId: string,
    @Param('id') leadId: string,
    @Body() data: { type: string; content: string; reminderDate?: string },
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.addActivity(tenantId, leadId, userId, data);
  }

  @Patch('activities/:id')
  updateActivity(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() data: { status?: string; content?: string },
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.updateActivity(tenantId, id, data);
  }

  @Post('leads/:id/convert')
  convertToCustomer(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Param('id') leadId: string,
  ) {
    this.ensureCrmAccess(user);
    return this.crmService.convertToCustomer(tenantId, leadId);
  }

  // Admin / Utility
  @Post('recalculate-scores')
  recalculateScores(@GetTenantId() tenantId: string, @GetUser() user: any) {
    this.ensureCrmAccess(user);
    return this.crmService.recalculateLeadScores(tenantId);
  }
}

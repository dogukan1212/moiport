import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId } from '../common/decorators/user.decorator';

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post()
  create(
    @GetTenantId() tenantId: string,
    @Body()
    data: {
      title: string;
      content: string;
      customerId: string;
      status?: string;
      metadata?: string;
    },
  ) {
    return this.proposalsService.create(tenantId, data);
  }

  @Get()
  findAll(
    @GetTenantId() tenantId: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.proposalsService.findAll(tenantId, customerId);
  }

  @Get(':id')
  findOne(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.proposalsService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @GetTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      content?: string;
      status?: string;
      metadata?: string;
    },
  ) {
    return this.proposalsService.update(tenantId, id, data);
  }

  @Delete(':id')
  remove(@GetTenantId() tenantId: string, @Param('id') id: string) {
    return this.proposalsService.remove(tenantId, id);
  }
}

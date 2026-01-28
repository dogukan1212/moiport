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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Query('customerId') customerId?: string,
  ) {
    return this.projectsService.findAll(tenantId, user, customerId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
  ) {
    return this.projectsService.findOne(id, tenantId, user);
  }

  @Post()
  create(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.projectsService.create(tenantId, data, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @Body() data: any,
  ) {
    return this.projectsService.update(id, tenantId, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.projectsService.delete(id, tenantId);
  }
}

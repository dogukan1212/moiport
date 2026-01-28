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
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../common/guards/auth.guard';
import { GetTenantId, GetUser } from '../common/decorators/user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('watchers/columns')
  getColumnWatchers(
    @GetTenantId() tenantId: string,
    @GetUser('userId') userId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.tasksService.getColumnWatchers(tenantId, userId, projectId);
  }

  @Post('watchers/columns')
  toggleColumnWatcher(
    @GetTenantId() tenantId: string,
    @GetUser('userId') userId: string,
    @Body() body: { columnId: string; projectId?: string },
  ) {
    return this.tasksService.toggleColumnWatcher(
      tenantId,
      userId,
      body.columnId,
      body.projectId,
    );
  }

  @Get()
  findAll(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Query('projectId') projectId?: string,
  ) {
    return this.tasksService.findAll(tenantId, projectId, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
  ) {
    return this.tasksService.findOne(id, tenantId, user);
  }

  @Post()
  create(
    @GetTenantId() tenantId: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.tasksService.create(tenantId, data, user);
  }

  @Patch('reorder')
  updateOrder(
    @GetTenantId() tenantId: string,
    @Body('taskIds') taskIds: string[],
  ) {
    return this.tasksService.updateOrder(tenantId, taskIds);
  }

  @Patch('positions')
  updatePositions(
    @GetTenantId() tenantId: string,
    @Body('changes')
    changes: Array<{ id: string; status: string; order: number }>,
  ) {
    return this.tasksService.updatePositions(tenantId, changes);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetTenantId() tenantId: string,
    @GetUser('userId') userId: string,
    @Body() data: any,
  ) {
    return this.tasksService.update(id, tenantId, data, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetTenantId() tenantId: string) {
    return this.tasksService.delete(id, tenantId);
  }
}

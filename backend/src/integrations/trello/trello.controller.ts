import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { GetTenantId } from '../../common/decorators/user.decorator';
import { TrelloService } from './trello.service';

@Controller('integrations/trello')
@UseGuards(JwtAuthGuard)
export class TrelloController {
  constructor(private readonly trelloService: TrelloService) {}

  @Get('config')
  getConfig(@GetTenantId() tenantId: string) {
    return this.trelloService.getConfig(tenantId);
  }

  @Post('config')
  updateConfig(
    @GetTenantId() tenantId: string,
    @Body()
    body: { apiKey?: string | null; token?: string | null; isActive?: boolean },
  ) {
    return this.trelloService.updateConfig(tenantId, body);
  }

  @Get('test')
  testAuth(@GetTenantId() tenantId: string) {
    return this.trelloService.testAuth(tenantId);
  }

  @Get('boards')
  listBoards(@GetTenantId() tenantId: string) {
    return this.trelloService.listBoards(tenantId);
  }

  @Get('boards/:boardId/lists')
  listBoardLists(
    @GetTenantId() tenantId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.trelloService.listBoardLists(tenantId, boardId);
  }

  @Post('import/board')
  importBoard(
    @GetTenantId() tenantId: string,
    @Body()
    body: {
      boardId: string;
      projectId?: string;
      customerId?: string;
      projectName?: string;
      listStatusMap: Record<string, string>;
    },
  ) {
    return this.trelloService.importBoardToProject(tenantId, body);
  }
}

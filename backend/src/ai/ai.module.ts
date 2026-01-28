import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { WebSearchService } from './web-search.service';
import { PexelsService } from './pexels.service';

@Module({
  controllers: [AIController],
  providers: [AIService, WebSearchService, PexelsService],
  exports: [AIService, PexelsService],
})
export class AIModule {}

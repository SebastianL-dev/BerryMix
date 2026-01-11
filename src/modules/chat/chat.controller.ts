import { Body, Controller, Get, Param, Post, Sse } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Sse()
  streamMessage(@Body() chat: { message: string; sessionId: string }) {
    return this.chatService.stream(
      'Qwen/Qwen3-Coder-30B-A3B-Instruct',
      chat.message,
      chat.sessionId,
    );
  }

  @Get('session/:sessionId')
  getHistory(@Param('sessionId') sessionId: string) {
    return {
      sessionId,
      history: this.chatService.getHistory(sessionId),
    };
  }
}

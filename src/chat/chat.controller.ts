import { Body, Controller, Post, Sse } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Sse()
  streamMessage(@Body() chat: { message: string }) {
    return this.chatService.stream(
      'Qwen/Qwen3-Coder-30B-A3B-Instruct',
      chat.message,
    );
  }
}

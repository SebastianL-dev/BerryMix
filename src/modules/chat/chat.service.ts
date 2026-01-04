import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import OpenAI from 'openai';
import { systemPrompt } from './prompts/system.prompts';
import { ChatCompletionMessageParam } from 'openai/resources';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  private readonly openaiEnv: { base_url: string; api_key: string };
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openaiEnv = {
      base_url: this.configService.get<string>('env.openai.base_url')!,
      api_key: this.configService.get<string>('env.openai.api_key')!,
    };

    this.openai = new OpenAI({
      baseURL: this.openaiEnv.base_url,
      apiKey: this.openaiEnv.api_key,
    });
  }

  private messages = new Map<string, ChatCompletionMessageParam[]>();

  createSession(sessionId: string) {
    this.messages.set(sessionId, [
      {
        role: 'system',
        content: systemPrompt,
      },
    ]);
  }

  getHistory(sessionId: string): ChatCompletionMessageParam[] {
    const history = this.messages.get(sessionId) || [];

    if (!history) return [];

    return history.filter((msg) => msg.role !== 'system');
  }

  stream(
    model: string,
    message: string,
    sessionId: string,
  ): Observable<{ data: string }> {
    return new Observable((subscriber) => {
      const run = async () => {
        try {
          if (!sessionId) throw new UnauthorizedException('Invalid session id');

          if (!this.messages.has(sessionId)) {
            this.createSession(sessionId);
          }

          const history = this.messages.get(sessionId) || [];

          history.push({
            role: 'user',
            content: message,
          });

          const stream = await this.openai.chat.completions.create({
            model: model,
            messages: history,
            stream: true,
          });

          let assistantRes = '';

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;

            if (delta) {
              assistantRes += delta;
              subscriber.next({ data: delta });
            }
          }

          history.push({
            role: 'assistant',
            content: assistantRes,
          });

          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      };

      void run();
    });
  }
}

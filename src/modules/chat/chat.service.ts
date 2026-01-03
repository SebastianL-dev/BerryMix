import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import OpenAI from 'openai';
import { systemPrompt } from './prompts/system.prompts';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class ChatService {
  private openai = new OpenAI({
    baseURL: process.env.OPEN_AI_BASE_URL,
    apiKey: process.env.OPEN_AI_API_KEY,
  });

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

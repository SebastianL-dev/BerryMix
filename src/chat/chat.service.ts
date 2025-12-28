import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private openai = new OpenAI({
    baseURL: process.env.OPEN_AI_BASE_URL,
    apiKey: process.env.OPEN_AI_API_KEY,
  });

  stream(model: string, message: string): Observable<{ data: string }> {
    return new Observable((subscriber) => {
      const run = async () => {
        try {
          const stream = await this.openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: 'user',
                content: message,
              },
            ],
            stream: true,
          });

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;

            if (delta) {
              subscriber.next({ data: delta });
            }
          }

          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      };

      void run();
    });
  }
}

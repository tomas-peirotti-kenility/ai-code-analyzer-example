/* eslint-disable @typescript-eslint/no-unused-vars */
import { DynamicModule, Module } from '@nestjs/common';
import { SendGridService } from './send-grid.service';

@Module({})
export class SendGridModule {
  static register(
    apiKey: string,
    defaultSenderEmail: string,
    defaultSenderName: string,
  ): DynamicModule {
    return {
      module: SendGridModule,
      providers: [
        {
          provide: 'apiKey',
          useValue: apiKey,
        },
        SendGridService,
      ],
      exports: [SendGridService],
    };
  }
}

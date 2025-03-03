import { DynamicModule, Module } from '@nestjs/common';
import { SNSProducer } from './sns.service';

@Module({})
export class SNSProducerModule {
  static register(apiVersion: string, region: string): DynamicModule {
    return {
      module: SNSProducerModule,
      providers: [
        {
          provide: 'apiVersion',
          useValue: apiVersion,
        },
        {
          provide: 'region',
          useValue: region,
        },
        SNSProducer,
      ],
      exports: [SNSProducer],
    };
  }
}

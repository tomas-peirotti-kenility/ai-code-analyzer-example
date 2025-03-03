import { DynamicModule, Module } from '@nestjs/common';
import { SQSConsumer, AWSQueueParams } from './sqs-consumer.service';
import { AwsConfigurationOptions } from './aws-configuration-options';

@Module({})
export class SQSConsumerModule {
  static register(
    params: AWSQueueParams,
    apiVersion: string,
    config: AwsConfigurationOptions,
  ): DynamicModule {
    return {
      module: SQSConsumerModule,
      providers: [
        {
          provide: 'AWSQueueParams',
          useValue: params,
        },
        {
          provide: 'apiVersion',
          useValue: apiVersion,
        },
        {
          provide: 'config',
          useValue: config,
        },
        SQSConsumer,
      ],
      exports: [SQSConsumer],
    };
  }
}

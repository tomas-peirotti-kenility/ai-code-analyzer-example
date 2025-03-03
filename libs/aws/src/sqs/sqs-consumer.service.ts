import { Inject, Injectable } from '@nestjs/common';
import { Consumer } from 'sqs-consumer';
import { AwsConfigurationOptions } from './aws-configuration-options';
import { SQSClient, Message } from '@aws-sdk/client-sqs';

export interface AWSQueueParams {
  AttributeNames?: string[];
  MaxNumberOfMessages?: number;
  MessageAttributeNames?: string[];
  QueueUrl: string;
  VisibilityTimeout?: number;
  WaitTimeSeconds: number;
}

@Injectable()
export class SQSConsumer {
  private queueParams: AWSQueueParams;
  private version: string;
  private sqs: Consumer;
  private config: AwsConfigurationOptions;
  private onMessage: (message: string) => Promise<void>;

  constructor(
    @Inject('AWSQueueParams') private params: AWSQueueParams,
    @Inject('apiVersion') private apiVersion: string,
    @Inject('config') private configParam: AwsConfigurationOptions,
  ) {
    this.queueParams = params;
    this.version = apiVersion;
    this.config = configParam;
  }

  subscribeQueue = (
    onMessage: (message: string) => Promise<void>,
    onError?: (err: any) => void,
  ): void => {
    this.onMessage = onMessage;
    this.sqs = Consumer.create({
      queueUrl: this.queueParams.QueueUrl,
      waitTimeSeconds: this.queueParams.WaitTimeSeconds,
      handleMessage: async (message) => {
        await this.handleMessage(message);
      },
      sqs: new SQSClient({
        region: process.env.AWS_DEFAULT_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        apiVersion: this.version,
      }),
    });
    this.sqs.start();

    ['error', 'processing_error', 'timeout_error'].forEach((event: any) => {
      this.sqs.on(event, (err) => {
        if (onError) onError(err);
      });
    });
  };

  handleMessage = async (message: Message): Promise<void> => {
    //LETS DO IT
    //Work with the data
    if (this.onMessage) {
      await this.onMessage(message.Body);
    }
  };
}

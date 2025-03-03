import { Inject, Injectable } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export type AWSMessageParams = {
  MessageBody: string;
  MessageGroupId: string;
};

@Injectable()
export class SNSProducer {
  private SNS: SNSClient;
  constructor(
    @Inject('apiVersion') private apiVersion: string,
    @Inject('region') private region: string,
  ) {
    this.SNS = new SNSClient({ apiVersion, region });
  }

  sendMessage = async (message: string, topic: string) => {
    const body = {
      Message: message,
      TopicArn: topic,
      MessageGroupId: '1',
    };

    return this.SNS.send(new PublishCommand(body));
  };
}

import { IsNotEmpty, IsString } from 'class-validator';

export class SNSNotificationDTO {
  @IsString()
  @IsNotEmpty()
  Type: string;

  @IsString()
  @IsNotEmpty()
  MessageId: string;

  @IsString()
  @IsNotEmpty()
  TopicArn: string;

  @IsString()
  @IsNotEmpty()
  Message: string;

  @IsString()
  @IsNotEmpty()
  Timestamp: string;

  @IsString()
  @IsNotEmpty()
  SignatureVersion: string;

  @IsString()
  @IsNotEmpty()
  Signature: string;

  @IsString()
  @IsNotEmpty()
  SigningCertURL: string;

  @IsString()
  @IsNotEmpty()
  UnsubscribeURL: string;
}

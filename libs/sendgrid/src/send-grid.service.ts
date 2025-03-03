import * as util from 'util';
import { Inject, Injectable } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridService {
  private apiKey: string;
  private defaultSenderEmail: string;
  private defaultSenderName: string;
  constructor(@Inject('apiKey') private apiKeyM) {
    this.apiKey = apiKeyM;
    sgMail.setApiKey(this.apiKey);
  }

  sendEmail = async (
    dynamicTemplateData: Record<string, any>,
    templateId: string,
    to: string,
    email: string,
    name: string,
  ) => {
    try {
      await sgMail.send({
        to,
        from: {
          email,
          name,
        },
        dynamicTemplateData,
        templateId,
      });
      console.log('Email sent!');
    } catch (error) {
      console.log(
        'Sendgrid Error: ',
        util.inspect(error, {
          depth: null,
          colors: false,
        }),
      );
    }
  };
}

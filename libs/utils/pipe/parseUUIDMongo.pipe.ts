import { PipeTransform, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export default class ParseUUIDMongoPipe implements PipeTransform {
  constructor(private readonly uuidArrays: string[]) {}
  transform(body: object) {
    const newBody = { ...body };
    Object.keys(body).forEach((keyBody) => {
      const isUUID = this.uuidArrays.find((keyUUID) => keyUUID === keyBody);
      if (isUUID) newBody[keyBody] = new Types.ObjectId(body[keyBody]);
    });
    return { ...newBody };
  }
}

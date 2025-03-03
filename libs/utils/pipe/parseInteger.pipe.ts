import { PipeTransform, Injectable, HttpException } from '@nestjs/common';

@Injectable()
export default class ParseIntegerPipe implements PipeTransform {
  constructor(private readonly intKeys: string[]) {}
  transform(body: object) {
    const newBody = { ...body };
    this.intKeys.forEach((intKey) => {
      if (body[intKey]) {
        const number = parseInt(body[intKey]);
        if (!isNaN(number)) {
          newBody[intKey] = number;
        } else {
          throw new HttpException('Bad Request Exception', 400);
        }
      }
    });
    return { ...newBody };
  }
}

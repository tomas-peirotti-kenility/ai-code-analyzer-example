import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, randomUUID } from 'crypto';

@Injectable()
export class EncryptionService {
  encrypt(data: string, salt: string) {
    return createHmac('sha256', salt).update(data).digest('hex');
  }

  generateSalt() {
    const firstRandom = Math.round(
      new Date().valueOf() * Math.random(),
    ).toString();
    const secondRandom = Math.round(
      new Date().valueOf() * Math.random(),
    ).toString();
    return firstRandom.concat(secondRandom);
  }

  compareHash(password: string, salt: string, hash: string) {
    const storedPassword = this.encrypt(password, salt);
    return storedPassword === hash;
  }

  randomHash() {
    return randomBytes(20).toString('hex');
  }

  randomUUID() {
    return randomUUID();
  }

  randomAlphanumeric(length: number) {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyz';

    const result = Array(length)
      .fill(null)
      .reduce(
        (result) =>
          (result +=
            characters[Math.round(Math.random() * (characters.length - 1))]),
        '',
      );

    return result;
  }
}

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URI_CONNECTION;

//const SHORT_LIVED = 300; // 5 minutes in seconds
//const LONG_LIVED = 3600; // 1 hour in seconds
@Injectable()
export class RedisService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RedisService.name);
  _client: RedisClientType;
  _pingInterval;
  keyPrefix = process.env.REDIS_KEY_PREFIX;

  onApplicationBootstrap(): any {
    this.connect();
  }

  connect() {
    if (this._client) {
      this._client
        .disconnect()
        .then(() => this.logger.log('REDIS SERVICE Client disconnected'))
        .catch((err) =>
          this.logger.error('REDIS SERVICE Error disconnecting client', {
            err,
          }),
        );
      clearInterval(this._pingInterval);
    }

    this._client = createClient({
      url: redisUrl,
      socket: { reconnectStrategy: 1000 },
    });

    (this._client as any).on('connect', () => {
      this.logger.log('REDIS SERVICE Connected to Redis!');
    });

    this._client.on('error', (err) => {
      this.logger.error('REDIS SERVICE Error', { err });
      if (
        (typeof err === 'string' && err.includes('connection')) ||
        (typeof err === 'object' &&
          ['CONNECTION_BROKEN', 'NR_CLOSED', 'EADDRNOTAVAIL'].indexOf(
            err.code,
          ) > -1)
      ) {
        this.logger.log('Server stopped due to redis connection');
        process.exit(1);
      }
    });

    this._client.connect();

    this._pingInterval = setInterval(async () => {
      this.logger.debug('REDIS SERVICE Sending Ping...');
      await this._client.ping();
    }, 30000);
  }

  async getHash(hashKey: string) {
    try {
      return this._client.hGetAll(hashKey as any);
    } catch (err) {
      this.logger.error('REDIS SERVICE getHash Error', { err });
    }
  }

  async getHashField(hashKey: string, fieldName: string) {
    try {
      return this._client.hGet(hashKey as any, fieldName as any);
    } catch (err) {
      this.logger.error('REDIS SERVICE getHashField Error', { err });
    }
  }

  async getHashFields(
    hashKey: string,
    fieldNames: string[],
  ): Promise<string[]> {
    try {
      return this._client.hmGet(hashKey as any, fieldNames as any);
    } catch (err) {
      this.logger.error('REDIS SERVICE getHashFields Error', { err });
    }
  }

  async removeHashFields(hashKey: string, fieldNames: string) {
    try {
      return this._client.hDel(hashKey as any, fieldNames as any);
    } catch (err) {
      this.logger.error('REDIS SERVICE removeHashFields Error', { err });
    }
  }

  async set(key: string, value: any, expiration?: number) {
    try {
      // TODO: use correct type instead of any
      return this._client.set(
        `${this.keyPrefix}${key}` as any,
        JSON.stringify(value) as any,
        { EX: expiration } as any,
      );
    } catch (err) {
      this.logger.error('REDIS SERVICE set Error', { err });
    }
  }

  async get(key: string): Promise<any> {
    try {
      // TODO: use correct type instead of any
      const cachedData = await this._client.get(
        `${this.keyPrefix}${key}` as any,
      );
      return cachedData?.includes('{') ? JSON.parse(cachedData) : cachedData;
    } catch (err) {
      this.logger.error('REDIS SERVICE get Error', { err });
    }
  }

  async remove(key: string) {
    try {
      // TODO: use correct type instead of any
      return this._client.del(`${this.keyPrefix}${key}` as any);
    } catch (err) {
      this.logger.error('REDIS SERVICE remove Error', { err });
    }
  }

  async setHashField(
    hashKey: string,
    fieldName: string,
    value: string,
    expireInSeconds?: number,
  ) {
    try {
      const response = await this._client.hSet(
        hashKey as any,
        fieldName as any,
        value as any,
      );

      if (expireInSeconds)
        await this._client.expire(hashKey as any, expireInSeconds as any);

      return response;
    } catch (err) {
      this.logger.error('REDIS SERVICE setHashField Error', { err });
    }
  }

  async removeHashField(hashKey: string, fieldName: string) {
    try {
      return this._client.hDel(hashKey as any, fieldName as any);
    } catch (err) {
      this.logger.error('REDIS SERVICE removeHashField Error', { err });
    }
  }

  async setHashFields(
    hashKey: string,
    values: { field: string; value: string }[],
    expireInSeconds?: number,
  ) {
    try {
      const valuesArr = [];
      for (const value of values) {
        valuesArr.push(value.field);
        valuesArr.push(value.value);
      }
      const response = await this._client.hSet(
        hashKey as any,
        valuesArr as any,
      );

      if (expireInSeconds)
        await this._client.expire(hashKey as any, expireInSeconds as any);

      return response;
    } catch (err) {
      this.logger.error('REDIS SERVICE setHashFields Error', { err });
    }
  }

  async getHashValues(hashKey: string) {
    try {
      return this._client.hVals(hashKey as any);
    } catch (err) {
      this.logger.error('REDIS SERVICE getHash Error', { err });
    }
  }

  async getHashKeys(hashKey: string): Promise<string[]> {
    try {
      return this._client.hKeys(hashKey as any);
    } catch (err) {
      this.logger.error('REDIS SERVICE getHashKeys Error', { err });
    }
  }

  async setExpiry(key: string, expiration: number) {
    try {
      // TODO: use correct type instead of any
      return this._client.expire(
        `${this.keyPrefix}${key}` as any,
        expiration as any,
      );
    } catch (err) {
      this.logger.error('REDIS SERVICE setExpiry Error', { err });
    }
  }
}

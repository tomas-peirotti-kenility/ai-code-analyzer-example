import { Module } from '@nestjs/common';
import { RedisService } from '@app/redis/redis.service';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

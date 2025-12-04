import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { ReserveManagerService } from '../src/compliance/reserve-manager.service';
import { IngestorService } from '../src/analytics/ingestor.service';
import { createIngestorStub, createPrismaMock, createRedisStub, createReserveManagerStub } from './test-utils';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .overrideProvider(RedisService)
      .useValue(createRedisStub())
      .overrideProvider(ReserveManagerService)
      .useValue(createReserveManagerStub())
      .overrideProvider(IngestorService)
      .useValue(createIngestorStub())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/redis/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/redis/health')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body).toHaveProperty('connected');
        expect(res.body).toHaveProperty('hits');
        expect(res.body).toHaveProperty('misses');
        expect(res.body).toHaveProperty('memoryItems');
      });
  });

  it('/redis/metrics (GET)', () => {
    return request(app.getHttpServer())
      .get('/redis/metrics')
      .expect(200)
      .expect('Content-Type', /text\/plain/)
      .then((res) => {
        expect(res.text).toContain('redis_connected');
        expect(res.text).toContain('redis_cache_hits_total');
        expect(res.text).toContain('redis_cache_misses_total');
      });
  });
});

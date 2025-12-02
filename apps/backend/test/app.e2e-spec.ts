import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

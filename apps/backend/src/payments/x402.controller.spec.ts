import { Test } from '@nestjs/testing';
import { X402Controller } from './x402.controller';
import { X402Service } from './x402.service';

describe('X402Controller', () => {
  let controller: X402Controller;
  let x402Service: { getStatus: jest.Mock; createQuote: jest.Mock };

  beforeEach(async () => {
    const mockX402Service = {
      getStatus: jest.fn(),
      createQuote: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [X402Controller],
      providers: [{ provide: X402Service, useValue: mockX402Service }],
    }).compile();

    controller = module.get(X402Controller);
    x402Service = module.get(X402Service);
  });

  it('should return x402 status', () => {
    x402Service.getStatus.mockReturnValue({ enabled: true, mode: 'stub' });

    expect(controller.getStatus()).toEqual({ enabled: true, mode: 'stub' });
    expect(x402Service.getStatus).toHaveBeenCalled();
  });

  it('should create x402 quote', () => {
    const dto = { amount: '50.00', asset: 'STLT', intent: 'deposit' };
    x402Service.createQuote.mockReturnValue({ ok: true, quote: { sessionId: 'session-1' } });

    expect(controller.createQuote(dto)).toEqual({ ok: true, quote: { sessionId: 'session-1' } });
    expect(x402Service.createQuote).toHaveBeenCalledWith(dto);
  });
});
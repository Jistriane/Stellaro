import { HorizonService } from './horizon.service';

describe('HorizonService', () => {
  it('instancia corretamente', () => {
    const service = new HorizonService();
    expect(service).toBeDefined();
  });
});

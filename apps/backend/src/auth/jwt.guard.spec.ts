import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
  let guard;

  beforeEach(() => {
    guard = new JwtGuard();
  });

  it('should throw when no authorization header', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    };
    expect(() => guard.canActivate(context)).toThrow();
  });

  it('should throw when missing Bearer prefix', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Basic xyz' } }),
      }),
    };
    expect(() => guard.canActivate(context)).toThrow();
  });

  it('should throw with invalid token', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer invalid' } }),
      }),
    };
    expect(() => guard.canActivate(context)).toThrow();
  });
});

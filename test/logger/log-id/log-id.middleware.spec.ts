import { LogIdMiddleware } from '../../../src/logger/log-id/log-id.middleware';

describe('LogIdMiddleware', () => {
  it('should be defined', () => {
    expect(new LogIdMiddleware()).toBeDefined();
  });
});

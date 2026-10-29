import { AppService } from './app.service.js';

describe('AppService', () => {
  const service = new AppService();

  it('returns Hello World when name is omitted', () => {
    expect(service.getHello()).toBe('Hello World!');
  });

  it('returns Hello World when name is empty', () => {
    expect(service.getHello('')).toBe('Hello World!');
  });

  it('returns a personalized greeting when name is provided', () => {
    expect(service.getHello('Toca')).toBe('Hello Toca!');
  });
});

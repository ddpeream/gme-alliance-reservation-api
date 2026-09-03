import { TestApp } from './utils/test-app';

describe('App Health Check (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = new TestApp();
    await testApp.init();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('should be defined', () => {
    expect(testApp).toBeDefined();
  });
});

import secureStore from '../src/services/secureStore.js';

describe('FinTrack Mobile - Secure Storage Service', () => {
  beforeEach(async () => {
    await secureStore.clearAuth();
  });

  afterEach(async () => {
    await secureStore.clearAuth();
  });

  it('should save, retrieve, and remove JWT token', async () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testToken123';
    
    // Save
    const saveResult = await secureStore.saveToken(testToken);
    expect(saveResult).toBe(true);

    // Retrieve
    const retrieved = await secureStore.getToken();
    expect(retrieved).toBe(testToken);

    // Remove
    await secureStore.removeToken();
    const afterRemove = await secureStore.getToken();
    expect(afterRemove).toBeNull();
  });

  it('should save, retrieve, and remove User profile object', async () => {
    const userProfile = {
      id: 'usr_98765',
      name: 'Pradeep',
      email: 'pradeep@example.com',
    };

    // Save
    await secureStore.saveUser(userProfile);

    // Retrieve
    const retrieved = await secureStore.getUser();
    expect(retrieved).toEqual(userProfile);
    expect(retrieved.email).toBe('pradeep@example.com');

    // Remove
    await secureStore.removeUser();
    const afterRemove = await secureStore.getUser();
    expect(afterRemove).toBeNull();
  });

  it('should clear all credentials with clearAuth()', async () => {
    await secureStore.saveToken('token_to_wipe');
    await secureStore.saveUser({ id: 'user_to_wipe' });

    await secureStore.clearAuth();

    expect(await secureStore.getToken()).toBeNull();
    expect(await secureStore.getUser()).toBeNull();
  });
});

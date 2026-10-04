import { api, setOnUnauthorizedCallback } from '../src/services/api.js';
import secureStore from '../src/services/secureStore.js';
import { ENV } from '../src/config/env.js';

describe('FinTrack Mobile - API Interceptor & Error Classification', () => {
  let responseErrorHandler;

  beforeAll(() => {
    // Find the response error interceptor handler from the Axios instance
    const responseInterceptor = api.interceptors.response.handlers[0];
    responseErrorHandler = responseInterceptor.rejected;
  });

  it('1. should verify default API timeout is 15000ms', () => {
    expect(api.defaults.timeout).toBe(15000);
    expect(ENV.REQUEST_TIMEOUT_MS).toBe(15000);
    expect(ENV.COPILOT_REQUEST_TIMEOUT_MS).toBe(60000);
  });

  it('2. should format Copilot timeout error with Copilot-specific message', async () => {
    const copilotTimeoutErr = {
      code: 'ECONNABORTED',
      message: 'timeout of 60000ms exceeded',
      config: { url: '/copilot/chat', isCopilot: true }
    };

    await expect(responseErrorHandler(copilotTimeoutErr)).rejects.toEqual({
      success: false,
      message: 'Copilot is taking longer than expected. Please try again.',
      isNetworkError: false,
      isTimeout: true,
      statusCode: 0
    });
  });

  it('3. should format non-Copilot request timeout error with general timeout message', async () => {
    const standardTimeoutErr = {
      code: 'ECONNABORTED',
      message: 'timeout of 15000ms exceeded',
      config: { url: '/reports/monthly' }
    };

    await expect(responseErrorHandler(standardTimeoutErr)).rejects.toEqual({
      success: false,
      message: 'Request timed out. Please check your network connection or server status.',
      isNetworkError: false,
      isTimeout: true,
      statusCode: 0
    });
  });

  it('4. should format physical network connection failure cleanly', async () => {
    const networkFailureErr = {
      message: 'Network Error',
      config: { url: '/reports/monthly' }
    };

    await expect(responseErrorHandler(networkFailureErr)).rejects.toEqual({
      success: false,
      message: 'Unable to connect to FinTrack server. Please check your network connection or server status.',
      isNetworkError: true,
      isTimeout: false,
      statusCode: 0
    });
  });

  it('5. should handle HTTP 401 unauthorized and invoke clearAuth and callback', async () => {
    const clearAuthSpy = jest.spyOn(secureStore, 'clearAuth').mockResolvedValue();
    const unauthorizedCb = jest.fn();
    setOnUnauthorizedCallback(unauthorizedCb);

    const http401Err = {
      response: {
        status: 401,
        data: { message: 'Token expired or revoked.' }
      }
    };

    await expect(responseErrorHandler(http401Err)).rejects.toEqual({
      success: false,
      message: 'Token expired or revoked.',
      statusCode: 401,
      data: { message: 'Token expired or revoked.' }
    });

    expect(clearAuthSpy).toHaveBeenCalled();
    expect(unauthorizedCb).toHaveBeenCalled();

    clearAuthSpy.mockRestore();
  });

  it('6. should preserve HTTP 4xx/5xx server errors without classifying them as network errors', async () => {
    const http500Err = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error in calculation engine.' }
      }
    };

    const resultPromise = responseErrorHandler(http500Err);
    await expect(resultPromise).rejects.toEqual({
      success: false,
      message: 'Internal Server Error in calculation engine.',
      statusCode: 500,
      data: { message: 'Internal Server Error in calculation engine.' }
    });
  });
});

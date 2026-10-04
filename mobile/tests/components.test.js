import React from 'react';
import { theme, colors, spacing, borderRadius } from '../src/theme/index.js';
import { ENV } from '../src/config/env.js';

describe('FinTrack Mobile - Design System Tokens & Config', () => {
  it('should export complete theme palette with light warm base and brand colors', () => {
    expect(theme.colors.background).toBe('#F7FBF9');
    expect(theme.colors.surface).toBe('#FFFFFF');
    expect(theme.colors.primary).toBe('#10B981');
    expect(theme.colors.secondary).toBe('#0D9488');
    expect(theme.colors.success).toBe('#10B981');
    expect(theme.colors.warning).toBe('#D97706');
    expect(theme.colors.danger).toBe('#E11D48');
    expect(theme.colors.textPrimary).toBe('#0F172A');
  });

  it('should export spacing, typography, and border radius scales', () => {
    expect(theme.spacing.lg).toBe(16);
    expect(theme.spacing.xl).toBe(20);
    expect(theme.borderRadius.md).toBe(12);
    expect(theme.borderRadius.lg).toBe(16);
    expect(theme.typography.sizes.hero).toBe(32);
    expect(theme.typography.sizes.xxl).toBe(24);
    expect(theme.typography.sizes.md).toBe(15);
  });

  it('should have properly configured environment constants', () => {
    expect(ENV.APP_NAME).toBe('FinTrack');
    expect(ENV.TOKEN_STORAGE_KEY).toBe('fintrack_jwt_token');
    expect(ENV.USER_STORAGE_KEY).toBe('fintrack_user_profile');
    expect(ENV.REQUEST_TIMEOUT_MS).toBe(15000);
  });
});

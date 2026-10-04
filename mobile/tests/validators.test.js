import {
  validateEmail,
  validatePassword,
  validateName,
  validateLoginForm,
  validateSignupForm,
} from '../src/utils/validators.js';

describe('FinTrack Mobile - Form & Auth Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.in')).toBe(true);
      expect(validateEmail('alex_sharma@fintrack.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('plainaddress')).toBe(false);
      expect(validateEmail('@missingusername.com')).toBe(false);
      expect(validateEmail('username@.com')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept passwords with 6 or more characters', () => {
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('securePassword#2026')).toBe(true);
    });

    it('should reject short or empty passwords', () => {
      expect(validatePassword('')).toBe(false);
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword(null)).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate names with at least 2 characters', () => {
      expect(validateName('Alex')).toBe(true);
      expect(validateName('Pradeep Kumar')).toBe(true);
    });

    it('should reject single letter or empty names', () => {
      expect(validateName('')).toBe(false);
      expect(validateName('A')).toBe(false);
      expect(validateName('   ')).toBe(false);
    });
  });

  describe('validateLoginForm', () => {
    it('should pass on valid credentials', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should return errors for missing and invalid fields', () => {
      const result = validateLoginForm({
        email: 'invalid-email',
        password: '123',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.password).toBe('Password must be at least 6 characters');
    });

    it('should return errors for completely empty fields', () => {
      const result = validateLoginForm({ email: '', password: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address is required');
      expect(result.errors.password).toBe('Password is required');
    });
  });

  describe('validateSignupForm', () => {
    it('should pass on valid registration data with matching passwords', () => {
      const result = validateSignupForm({
        name: 'Pradeep',
        email: 'pradeep@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('should reject mismatched passwords', () => {
      const result = validateSignupForm({
        name: 'Pradeep',
        email: 'pradeep@example.com',
        password: 'password123',
        confirmPassword: 'differentPassword',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe('Passwords do not match');
    });

    it('should reject empty name and invalid email', () => {
      const result = validateSignupForm({
        name: '',
        email: 'bademail',
        password: '123',
        confirmPassword: '123',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Full name is required');
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.password).toBe('Password must be at least 6 characters');
    });
  });
});

import { z } from 'zod';

/**
 * Creates an email schema with optional localization for the error message.
 * @param t Optional translation fn taking the translation key, returns string error message
 */
export const emailSchema = (t?: (key: string) => string) =>
  z.union([
    z.literal(''),
    z.string().trim().email(t ? t('validation.emailInvalid') : 'Invalid email format'),
  ]);

/**
 * Requires a minimum string length of 1 (useful to avoid empty strings passing normal .string() checks)
 */
export const requiredStringSchema = (errorMessage = 'This field is required') =>
  z.string().trim().min(1, errorMessage);

/**
 * Positive float generic schema
 */
export const positiveNumberSchema = (errorMessage = 'Must be greater than 0') =>
  z.coerce.number().positive(errorMessage);

/**
 * Non-negative generic schema (>=0)
 */
export const nonNegativeNumberSchema = (errorMessage = 'Must be zero or greater') =>
  z.coerce.number().min(0, errorMessage);

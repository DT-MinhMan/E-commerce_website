export const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isSlug = (value: string): boolean => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export const isCurrencyCode = (value: string): boolean => /^[A-Z]{3}$/.test(value);

export const isNonNegativeInteger = (value: number): boolean => Number.isInteger(value) && value >= 0;

export const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value >= 1;

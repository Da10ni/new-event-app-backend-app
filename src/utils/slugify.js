import slugifyLib from 'slugify';
import crypto from 'crypto';

export const createSlug = (text) => {
  const baseSlug = slugifyLib(text, { lower: true, strict: true, trim: true });
  const uniqueSuffix = crypto.randomBytes(3).toString('hex');
  return `${baseSlug}-${uniqueSuffix}`;
};

export const createBaseSlug = (text) => {
  return slugifyLib(text, { lower: true, strict: true, trim: true });
};

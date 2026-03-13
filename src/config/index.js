import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/events_platform',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || 'noreply@eventsplatform.com',
  },

  otp: {
    expiresInMinutes: parseInt(process.env.OTP_EXPIRES_IN, 10) || 10,
    maxAttempts: 5,
  },

  cors: {
    allowedOrigins: (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024,
    maxImagesPerListing: 15,
  },

  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  },

  app: {
    providerPortalUrl: process.env.PROVIDER_PORTAL_URL || 'http://localhost:5174',
  },
};

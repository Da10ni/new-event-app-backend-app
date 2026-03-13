import { config } from './index.js';

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (config.env === 'development') return callback(null, true);

    if (config.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Client-Type',
    'X-App-Version',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
};

export default corsOptions;

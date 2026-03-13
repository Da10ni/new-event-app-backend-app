import multer from 'multer';
import { UPLOAD_CONSTANTS } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (UPLOAD_CONSTANTS.ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(MESSAGES.UPLOAD.INVALID_TYPE, HTTP_STATUS.BAD_REQUEST), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONSTANTS.MAX_FILE_SIZE,
  },
});

export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);

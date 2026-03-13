import cloudinary from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';
import { HTTP_STATUS, MESSAGES } from '../constants/index.js';

export const uploadImage = async (file, folder) => {
  try {
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    throw new AppError(MESSAGES.UPLOAD.FAILED, HTTP_STATUS.INTERNAL_ERROR);
  }
};

export const uploadMultipleImages = async (files, folder) => {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
};

export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new AppError('Failed to delete image.', HTTP_STATUS.INTERNAL_ERROR);
  }
};

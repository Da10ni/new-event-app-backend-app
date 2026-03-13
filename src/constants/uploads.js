export const UPLOAD_CONSTANTS = Object.freeze({
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_IMAGES_PER_LISTING: 15,
  MAX_IMAGES_PER_REVIEW: 5,
  MAX_VERIFICATION_DOCS: 5,
  ALLOWED_MIMETYPES: ['image/jpeg', 'image/png', 'image/webp'],
  CLOUDINARY_FOLDERS: {
    AVATARS: 'events-platform/avatars',
    LISTINGS: 'events-platform/listings',
    REVIEWS: 'events-platform/reviews',
    CATEGORIES: 'events-platform/categories',
    VERIFICATION_DOCS: 'events-platform/verification-docs',
  },
});

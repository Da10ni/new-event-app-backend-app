import Category from '../models/Category.model.js';
import { logger } from '../utils/logger.js';

const categories = [
  { name: 'Venues', slug: 'venues', description: 'Event venues including banquet halls, marquees, lawns, and indoor spaces', sortOrder: 1 },
  { name: 'Catering', slug: 'catering', description: 'Food and catering services for events and gatherings', sortOrder: 2 },
  { name: 'Decoration', slug: 'decoration', description: 'Event decoration and styling services', sortOrder: 3 },
  { name: 'Beach Huts', slug: 'beach-huts', description: 'Beach huts and coastal accommodations for short stays', sortOrder: 4 },
  { name: 'Farm Houses', slug: 'farm-houses', description: 'Farm houses and countryside retreats for events and stays', sortOrder: 5 },
  { name: 'Photography', slug: 'photography', description: 'Professional photographers and videographers', sortOrder: 6 },
  { name: 'DJ & Music', slug: 'dj-music', description: 'DJs, musicians, and sound system services', sortOrder: 7 },
  { name: 'Makeup Artists', slug: 'makeup-artists', description: 'Professional makeup and beauty services', sortOrder: 8 },
  { name: 'Transport', slug: 'transport', description: 'Event transport and vehicle rental services', sortOrder: 9 },
  { name: 'Event Planners', slug: 'event-planners', description: 'Full-service event planning and coordination', sortOrder: 10 },
  { name: 'Florists', slug: 'florists', description: 'Floral arrangements and flower decoration services', sortOrder: 11 },
  { name: 'Other Services', slug: 'other-services', description: 'Other event-related services and providers', sortOrder: 12 },
];

export const seedCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count > 0) {
      logger.info('Categories already seeded. Skipping...');
      return;
    }

    await Category.insertMany(categories);
    logger.info(`${categories.length} categories seeded successfully.`);
  } catch (error) {
    logger.error('Error seeding categories:', error.message);
  }
};

import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, listing: 1 }, { unique: true });
favoriteSchema.index({ user: 1, createdAt: -1 });
favoriteSchema.index({ listing: 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;

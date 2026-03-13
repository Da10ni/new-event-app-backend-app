import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, maxlength: 500 },
    icon: { url: { type: String }, publicId: { type: String } },
    image: { url: { type: String }, publicId: { type: String } },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    listingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;

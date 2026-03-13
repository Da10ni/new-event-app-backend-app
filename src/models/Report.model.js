import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: { type: String, enum: ['listing', 'vendor', 'review', 'user'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      required: true,
      enum: [
        'inappropriate_content',
        'fake_listing',
        'spam',
        'fraud',
        'harassment',
        'misleading_info',
        'copyright',
        'other',
      ],
    },
    description: { type: String, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'investigating', 'resolved', 'dismissed'], default: 'pending' },
    adminNote: { type: String, maxlength: 1000 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ entityType: 1, entityId: 1 });
reportSchema.index({ reporter: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;

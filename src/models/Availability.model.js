import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    date: { type: Date, required: true },
    isAvailable: { type: Boolean, default: true },
    slots: [
      {
        startTime: { type: String },
        endTime: { type: String },
        isAvailable: { type: Boolean, default: true },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      },
    ],
    customPrice: { type: Number, min: 0 },
    note: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

availabilitySchema.index({ listing: 1, date: 1 }, { unique: true });
availabilitySchema.index({ vendor: 1, date: 1 });
availabilitySchema.index({ date: 1, isAvailable: 1 });
availabilitySchema.index({ listing: 1, date: 1, isAvailable: 1 });

const Availability = mongoose.model('Availability', availabilitySchema);
export default Availability;

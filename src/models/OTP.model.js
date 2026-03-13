import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    purpose: {
      type: String,
      enum: ['email_verification', 'phone_verification', 'password_reset'],
      required: true,
    },
    code: { type: String, required: true },
    attempts: { type: Number, default: 0, max: 5 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ userId: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'staff', 'manager'],
      default: 'customer',
      index: true,
    },
    phone: { type: String, default: '' },
    accountNumber: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    phone: this.phone,
    accountNumber: this.accountNumber,
    balance: this.balance,
    memberSince: this.memberSince,
  };
};

const User = mongoose.model('User', userSchema);

export default User;

import mongoose from 'mongoose';

const loanRateSchema = new mongoose.Schema(
  {
    loanType: {
      type: String,
      enum: ['personal', 'home', 'auto', 'business'],
      required: true,
      unique: true,
      index: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const LoanRate = mongoose.model('LoanRate', loanRateSchema);

export default LoanRate;
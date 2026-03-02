import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loanType: {
      type: String,
      enum: ['personal', 'home', 'auto', 'business'],
      required: true,
    },
    amount: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    monthlyPayment: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;

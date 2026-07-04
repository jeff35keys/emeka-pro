const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment ID is required']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cryptocurrency', 'credit_card'],
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Cash Payment Details
  cashDetails: {
    receivedBy: String,
    receivedAt: Date,
    receipt: String
  },
  
  // Bank Transfer Details
  bankTransferDetails: {
    bankName: String,
    accountNumber: String,
    transactionReference: String,
    proofImage: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verifiedBy: String,
    verifiedAt: Date
  },
  
  // Cryptocurrency Details
  cryptoDetails: {
    coinType: String, // Bitcoin, Ethereum, etc.
    walletAddress: String,
    transactionHash: String,
    amountInCrypto: String,
    exchangeRate: Number,
    confirmations: Number
  },
  
  // Credit Card Details
  cardDetails: {
    last4Digits: String,
    cardBrand: String,
    expiryDate: String
  },
  
  paidAt: Date,
  invoiceUrl: String,
  receiptUrl: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for queries
paymentSchema.index({ patientId: 1, paymentStatus: 1 });
paymentSchema.index({ doctorId: 1, paymentStatus: 1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ transactionId: 1 });

// Method to calculate commission
paymentSchema.methods.calculateCommission = function(commissionRate = 0.1) {
  return this.amount * commissionRate;
};

module.exports = mongoose.model('Payment', paymentSchema);

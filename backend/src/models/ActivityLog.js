import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: {
      type: String,
      enum: ['customer', 'staff', 'manager', 'system'],
      required: true,
      index: true,
    },
    action: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    targetRole: { type: String, enum: ['customer', 'staff', 'manager'] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;

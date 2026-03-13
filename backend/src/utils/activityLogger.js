import ActivityLog from '../models/ActivityLog.js';

export async function createActivityLog({
  actorUserId,
  actorRole,
  action,
  description,
  targetUserId,
  targetRole,
  metadata,
}) {
  try {
    await ActivityLog.create({
      actorUserId,
      actorRole,
      action,
      description,
      ...(targetUserId ? { targetUserId } : {}),
      ...(targetRole ? { targetRole } : {}),
      metadata: metadata || {},
    });
  } catch (error) {
    console.error('Failed to create activity log:', error.message);
  }
}

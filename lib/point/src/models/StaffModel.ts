import { Schema, model } from 'mongoose';
import { IStaff } from 'src/@types/staff-model';

const staffSchema = new Schema({
    id: String,
    staffStartTime: { type: Number, default: () => Date.now() },
    allPoints: { type: Number, default: 0 },
    lastWeekPoints: { type: Number, default: 0 },
    oldRoles: { type: Array, default: [] },
    totalPoints: { type: Number, default: 0 },
    roleStarted: { type: Number, default: () => Date.now() },
    tasks: { type: Array, default: [] },
    registerPoints: { type: Number, default: 0 },
    otherPoints: { type: Number, default: 0 },
    messagePoints: { type: Number, default: 0 },
    responsibilityPoints: { type: Number, default: 0 },
    publicPoints: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
    invitedUsers: { type: Array, default: [] },
    staffTakes: { type: Array, default: [] },
    hasOrientation: { type: Boolean, default: false },
    orientationPoints: { type: Number, default: 0 },
    problemResolvePoints: { type: Number, default: 0 },
});

export const StaffModel = model<IStaff>('staffs', staffSchema);

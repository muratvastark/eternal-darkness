import { IStaffExcuse } from '@/types';
import { Schema, model } from 'mongoose';

const staffExcuseSchema = new Schema({
    createdTimestamp: { type: Number, default: () => Date.now() },
    activity: { type: Boolean, default: true },
    finishTimestamp: { type: Number, default: undefined },
    adminId: String,
    reason: String,
    staffId: String,
});

export const StaffExcuseModel = model<IStaffExcuse>('staffExcuse', staffExcuseSchema);

import { IStaffExcuse } from '@/types';
import { Schema, model } from 'mongoose';

const staffExcuseSchema = new Schema({
    createdTimestamp: { type: Number, default: () => Date.now() },
    finishTimestamp: { type: Number, default: undefined },
    adminId: String,
    reason: String,
    staffId: String,
});

export const StaffExcuseModel = model<IStaffExcuse>('staffExcuse', staffExcuseSchema);

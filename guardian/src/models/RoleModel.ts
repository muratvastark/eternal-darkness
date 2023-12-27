import { IRole } from '@/types';
import { Schema, model } from 'mongoose';

const roleSchema = new Schema({
    id: String,
    deletedTimestamp: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    name: String,
    color: Number,
    position: Number,
    permissions: String,
    members: { type: Array, default: [] },
    icon: { type: String, default: undefined },
    mentionable: { type: Boolean, default: undefined },
    hoist: { type: Boolean, default: false },
    channelOverwrites: { type: Array, default: [] },
});

export const RoleModel = model<IRole>('role', roleSchema);

import { IUser } from '@/types';
import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    id: String,
    days: { type: Number, default: 1 },
    lastDayTime: { type: Number, default: () => new Date().setHours(0, 0, 0, 0) },
    voiceXP: { type: Number, default: 0 },
    messageXP: { type: Number, default: 0 },
    voiceLevel: { type: Number, default: 1 },
    messageLevel: { type: Number, default: 1 },
    voices: { type: Object, default: {} },
    messages: { type: Object, default: {} },
    streams: { type: Object, default: {} },
    cameras: { type: Object, default: {} },
    afkInformation: { type: Object, default: {} },
    names: { type: Array, default: [] },
    roleLogs: { type: Array, default: [] },
    registers: { type: Array, default: [] },
    voiceLogs: { type: Array, default: [] },
    leaveInvites: { type: Number, default: 0 },
    normalInvites: { type: Number, default: 0 },
    inviter: { type: String, default: undefined },
    warns: { type: Array, default: [] },
    chatFriends: { type: Object, default: {} },
    voiceFriends: { type: Object, default: {} }
});

export const UserModel = model<IUser>('users', userSchema);

import { IPenal } from '@/types';
import { Schema, model } from 'mongoose';

const penalSchema = new Schema({
    id: Number,
    activity: { type: Boolean, default: true },
    createdTimestamp: { type: Number, default: () => Date.now() },
    finishTimestamp: { type: Number, default: undefined },
    visible: { type: Boolean, default: true },
    admin: String,
    reason: String,
    type: Number,
    user: String,
    remover: { type: String, default: undefined },
    removeReason: { type: String, default: undefined },
    removeTimestamp: { type: Number, default: undefined },
    roles: { type: Array, default: [] },
});

export const PenalModel = model<IPenal>('penals', penalSchema);

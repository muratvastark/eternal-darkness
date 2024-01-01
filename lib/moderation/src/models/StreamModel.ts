import { IStream } from '@/types';
import { Schema, model } from 'mongoose';

const streamSchema = new Schema({
    id: String,
    name: String,
    ownerId: String,
    permissions: { type: Array, default: [] },
});

export const StreamModel = model<IStream>('streams', streamSchema);

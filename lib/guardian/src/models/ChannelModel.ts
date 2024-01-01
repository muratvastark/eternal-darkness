import { IChannel } from '@/types';
import { Schema, model } from 'mongoose';

const channelSchema = new Schema({
    id: String,
    deletedTimestamp: { type: Number, default: 0 },
    name: String,
    type: Number,
    parentId: { type: String, default: undefined },
    topic: { type: String, default: undefined },
    position: Number,
    isNSFW: { type: Boolean, default: undefined },
    bitrate: { type: Number, default: undefined },
    messages: { type: Array, default: [] },
    userLimit: { type: Number, default: 0 },
    permissions: { type: Array, default: [] },
    isDeleted: { type: Boolean, default: false },
    rateLimitPerUser: { type: Number, default: undefined },
});

export const ChannelModel = model<IChannel>('channel', channelSchema);

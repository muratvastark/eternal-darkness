import { IGiveaway } from '@/types';
import { Schema, model } from 'mongoose';

const giveawaySchema = new Schema({
    messageId: String,
    channelId: String,
    endTimestamp: Number,
    winnerCount: Number,
    joiners: { type: Array, default: [] },
});

export const GiveawayModel = model<IGiveaway>('giveaways', giveawaySchema);

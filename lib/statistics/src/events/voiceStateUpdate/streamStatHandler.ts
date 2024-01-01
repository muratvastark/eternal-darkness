import { StatManager } from '@/managers';
import { VoiceState } from 'discord.js';

export default async function streamStatHandler(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.streaming && !newState.streaming) return;

    const now = new Date();
    if (!oldState.streaming &&newState.streaming) {
        StatManager.streams.set(oldState.id, {
            channelId: newState.channelId,
            updateAt: now.getTime(),
        });
        StatManager.addCount(oldState.id, 'streams');
        return;
    }

    if (oldState.streaming && !newState.streaming) {
        const cache = StatManager.streams.get(oldState.id);
        if (!cache) return;

        const diff = now.getTime() - cache.updateAt;
        if (diff > 0) StatManager.addStat(oldState.member, diff, 'streams');
        StatManager.streams.delete(oldState.id);
    }
}

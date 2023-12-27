import { StatManager } from '@/managers';
import { VoiceState } from 'discord.js';

export default async function cameraStatHandler(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.selfVideo && !newState.selfVideo) return;

    const now = new Date();
    if (!oldState.selfVideo && newState.selfVideo) {
        StatManager.cameras.set(oldState.id, {
            channelId: newState.channelId,
            updateAt: now.getTime(),
        });
        StatManager.addCount(oldState.id, 'cameras');
        return;
    }

    if (oldState.selfVideo && !newState.selfVideo) {
        const cache = StatManager.cameras.get(oldState.id);
        if (!cache) return;

        const diff = now.getTime() - cache.updateAt;
        if (diff > 0) StatManager.addStat(oldState.member, diff, 'cameras');
        StatManager.cameras.delete(oldState.id);
    }
}

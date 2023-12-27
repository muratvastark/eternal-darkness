import { StatManager } from '@/managers';
import { VoiceChannel, VoiceState } from 'discord.js';

export default function voiceStatHandler(oldState: VoiceState, newState: VoiceState) {
    const now = Date.now();

    if (!oldState.channelId && newState.channelId) {
        StatManager.voices.set(oldState.id, {
            channelId: newState.channelId,
            updateAt: now,
            joinedAt: now,
        });
        return;
    }

    const cache = StatManager.voices.get(oldState.id);
    if (!cache) return;

    const diff = now - cache.updateAt;
    if (oldState.channelId && !newState.channelId) {
        if (diff > 0) StatManager.addVoiceStat(oldState.member, oldState.channel as VoiceChannel, diff);
        StatManager.voices.delete(oldState.id);
        return;
    }

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        if (diff > 0) StatManager.addVoiceStat(oldState.member, oldState.channel as VoiceChannel, diff);

        StatManager.voices.set(oldState.id, {
            channelId: newState.channelId,
            updateAt: now,
            joinedAt: now,
        });
        return;
    }
}

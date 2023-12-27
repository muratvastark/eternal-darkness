import { StaffManager } from '@/managers';
import { IEvent } from '@/types';
import { Events, VoiceChannel } from 'discord.js';

const VoiceStateUpdate: IEvent<Events.VoiceStateUpdate> = {
    name: Events.VoiceStateUpdate,
    execute: (client, oldState, newState) => {
        if (!oldState.member || oldState.member.user.bot || !StaffManager.checkStaff(oldState.member)) return;

        const now = Date.now();

        if (!oldState.channelId && newState.channelId) {
            StaffManager.voices.set(oldState.id, { channelId: newState.channelId, updateAt: now });
            return;
        }

        const cache = StaffManager.voices.get(oldState.id);
        if (!cache) return;

        const diff = now - cache.updateAt;
        if (oldState.channelId && !newState.channelId) {
            if (diff > 0) StaffManager.addVoiceStat(oldState.member, oldState.channel as VoiceChannel, diff);
            StaffManager.voices.delete(oldState.id);
            return;
        }

        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            if (diff > 0) StaffManager.addVoiceStat(oldState.member, oldState.channel as VoiceChannel, diff);
            StaffManager.voices.set(oldState.id, { channelId: newState.channelId, updateAt: now });
            return;
        }
    },
};

export default VoiceStateUpdate;

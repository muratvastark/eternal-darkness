import { Events } from 'discord.js';
import voiceStatHandler from './voiceStatHandler';
import streamStatHandler from './streamStatHandler';
import cameraStatHandler from './cameraStatHandler';
import { IEvent } from '@/types';

const VoiceStateUpdate: IEvent<Events.VoiceStateUpdate> = {
    name: Events.VoiceStateUpdate,
    execute(client, oldState, newState) {
        if (!oldState.member || !oldState.guild || oldState.member.user.bot) return;

        streamStatHandler(oldState, newState);
        voiceStatHandler(oldState, newState);
        cameraStatHandler(oldState, newState);
    },
};

export default VoiceStateUpdate;

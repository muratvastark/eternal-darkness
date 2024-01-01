import { IEvent } from '@/types';
import checkEnter from './checkEnter';
import createChannel from './createChannel';
import { Events } from 'discord.js';

const VoiceStateUpdate: IEvent<Events.VoiceStateUpdate> = {
    name: Events.VoiceStateUpdate,
    execute: async (client, oldState, newState) => {
        checkEnter(oldState, newState);
        createChannel(client, newState, oldState);
    },
};

export default VoiceStateUpdate;

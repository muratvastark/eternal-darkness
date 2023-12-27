import { Events } from 'discord.js';
import streamLog from './streamLog';
import cameraLog from './cameraLog';
import joinLog from './joinLog';
import leaveLog from './leaveLog';
import deafLog from './deafLog';
import muteLog from './muteLog';

const VoiceStateUpdate: Moonlight.IEvent<Events.VoiceStateUpdate> = {
    name: Events.VoiceStateUpdate,
    execute: async (client, oldState, newState) => {
        if (!oldState.guild || !oldState.member || !newState.member || !newState.guild) return;

        if (!oldState.streaming && newState.streaming) streamLog(oldState);
        if (!oldState.selfVideo && newState.selfVideo) cameraLog(oldState);
        if ((!oldState.channelId && newState.channelId) || (newState.channelId && newState.channelId !== oldState.channelId)) joinLog(newState);
        if (oldState.channelId && !newState.channelId) leaveLog(oldState);
        if (!oldState.serverDeaf && newState.serverDeaf) deafLog(oldState);
        if (!oldState.serverMute && newState.serverMute) muteLog(oldState);
    },
};

export default VoiceStateUpdate;

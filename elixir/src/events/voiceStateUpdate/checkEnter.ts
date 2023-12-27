import { VoiceState } from 'discord.js';

function checkEnter(oldState: VoiceState, newState: VoiceState) {
    if (!oldState.member || !oldState.guild || !newState.channelId || !newState.channel.name.startsWith('Special Room'))
        return;

    const hasEnter = newState.channel.permissionOverwrites.cache.some((p) => p.id === newState.id);
    if (!hasEnter) newState.member.voice.disconnect();
}

export default checkEnter;

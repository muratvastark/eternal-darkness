import { MemberManager } from '@/managers';
import { StreamModel } from '@/models';
import { IEvent } from '@/types';
import { Events } from 'discord.js';

const VoiceStateUpdate: IEvent<Events.VoiceStateUpdate> = {
    name: Events.VoiceStateUpdate,
    execute: async (client, state) => {
        if (!client.streams.some((stream) => stream.channelId === state.channelId && stream.ownerId === state.member.id))
            return;

        setTimeout(async () => {
            const member = await MemberManager.getMember(state.guild, state.id);
            if (member && member.voice.channelId && member.voice.channelId === state.channelId) return;

            const streamData = await StreamModel.findOneAndDelete({ id: state.channelId });
            client.streams = client.streams.filter(({ channelId }) => channelId !== state.channelId);
            state.channel.permissionOverwrites.set(
                streamData.permissions.map((perm) => ({
                    id: perm.id,
                    allow: BigInt(perm.allow),
                    deny: BigInt(perm.deny),
                })),
            );
            state.channel.edit({ name: streamData.name, userLimit: 0 });
        }, 1000 * 60);
    },
};

export default VoiceStateUpdate;

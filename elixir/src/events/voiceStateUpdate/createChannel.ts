import { Client } from '@/base';
import { CategoryChannel, ChannelType, OverwriteType, PermissionFlagsBits, VoiceState } from 'discord.js';

async function createChannel(client: Client, newState: VoiceState, oldState: VoiceState) {
    const specialRoomCategory = newState.guild.channels.cache.get(
        client.config.SERVER.SPECIAL_ROOM_CATEGORY,
    ) as CategoryChannel;
    if (!specialRoomCategory || oldState.channelId === newState.channelId) return;

    if (
        oldState.channel &&
        oldState.channel.parent &&
        oldState.channel.parentId === specialRoomCategory.id &&
        oldState.channel.id !== client.config.SERVER.SPECIAL_ROOM_CREATE_CHANNEL &&
        oldState.channel.members.size === 0 &&
        oldState.channel.deletable
    )
        oldState.channel.delete();

    const childrenSize = newState.guild.channels.cache.filter(
        (c) =>
            c.parent &&
            c.parentId === specialRoomCategory.id &&
            c.id !== client.config.SERVER.SPECIAL_ROOM_CREATE_CHANNEL,
    ).size;
    if (
        newState.channel &&
        newState.channelId === client.config.SERVER.SPECIAL_ROOM_CREATE_CHANNEL &&
        childrenSize !== 17
    ) {
        const channel = await newState.guild.channels.create({
            name: 'Special Room',
            parent: specialRoomCategory.id,
            type: ChannelType.GuildVoice,
            userLimit: 2,
            permissionOverwrites: [
                {
                    id: newState.id,
                    type: OverwriteType.Member,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.Speak,
                        PermissionFlagsBits.Stream,
                        PermissionFlagsBits.DeafenMembers,
                        PermissionFlagsBits.MuteMembers,
                        PermissionFlagsBits.MoveMembers,
                    ],
                },
                {
                    id: newState.guild.id,
                    type: OverwriteType.Role,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.Connect],
                },
                {
                    id: client.config.SERVER.MUSIC_BOT_ROLE,
                    type: OverwriteType.Role,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.Connect],
                },
            ],
        });
        newState.setChannel(channel.id);
    }
}

export default createChannel;

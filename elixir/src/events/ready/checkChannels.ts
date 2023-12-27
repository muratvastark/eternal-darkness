import { Client } from '@/base';
import { CategoryChannel, ChannelType, Guild, OverwriteType, PermissionFlagsBits, VoiceChannel } from 'discord.js';

async function checkChannels(client: Client, guild: Guild) {
    guild.channels.cache
        .filter((c) => c.isVoiceBased() && c.name.startsWith('Special Room') && !c.members.size)
        .forEach((c) => c.delete());

    const createRoomChannel = guild.channels.cache.get(
        client.config.SERVER.SPECIAL_ROOM_CREATE_CHANNEL,
    ) as VoiceChannel;
    if (!createRoomChannel || !createRoomChannel.members.size) return;

    const category = guild.channels.cache.get(client.config.SERVER.SPECIAL_ROOM_CATEGORY) as CategoryChannel;
    if (!category) return;

    createRoomChannel.members.forEach(async (m) => {
        const childrenSize = guild.channels.cache.filter(
            (c) => c.parent && c.parentId === category.id && c.id !== client.config.SERVER.SPECIAL_ROOM_CREATE_CHANNEL,
        ).size;
        if (childrenSize >= 20) return;

        const channel = await guild.channels.create({
            name: 'Special Room',
            parent: category.id,
            type: ChannelType.GuildVoice,
            userLimit: 2,
            permissionOverwrites: [
                {
                    id: m.id,
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
                    id: guild.id,
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
        m.voice.setChannel(channel.id);
    });
}

export default checkChannels;

import { ICommand } from '@/types';
import { ChannelType, EmbedBuilder, PermissionFlagsBits, inlineCode } from 'discord.js';

const Distribute: ICommand = {
    usages: ['dağıt', 'dagit'],
    description: 'Bulunduğunuz ses kanalındaki üyeleri public odalara dağıtmaya yarar.',
    usableAuth: ['1179030512573091930', '1179403561747095552'],
    execute: async ({ client, message, args }) => {
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Önce bir ses kanalına bağlanman gerekiyor!');
            return;
        }

        const publicRooms = message.guild.channels.cache.filter(
            (c) => c.parentId === client.config.SERVER.PUBLIC_CATEGORY && c.type === ChannelType.GuildVoice,
        );
        [...message.member.voice.channel.members.values()]
            .filter((m) => m.voice.channelId === message.member.voice.channelId)
            .forEach((m) => m.voice.setChannel(publicRooms.random().id));

        message.channel.send({
            embeds: [
                embed.setDescription(
                    `${inlineCode(
                        message.member.voice.channel.name,
                    )} kanalındaki kullanıcılar başarıyla public kanallara dağıtılmaya başlandı.`,
                ),
            ],
        });
    },
};

export default Distribute;

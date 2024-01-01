import { ICommand } from '@/types';
import {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChannelSelectMenuInteraction,
    ChannelType,
    ComponentType,
    EmbedBuilder,
    inlineCode,
} from 'discord.js';

const AllTransport: ICommand = {
    usages: ['all-transport', 'herkesitaşı', 'htaşı'],
    description: 'Ses kanalında bulunan tüm kullanıcıları belirtilen kanala taşır.',
    usableAuth: ['1179030512573091930'],
    execute: async ({ client, message }) => {
        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Bir ses kanalında bulunman gerekiyor.');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const memberVoiceChannel = message.member.voice.channel;
        const row = new ActionRowBuilder<ChannelSelectMenuBuilder>({
            components: [
                new ChannelSelectMenuBuilder({
                    custom_id: 'menu',
                    placeholder: 'Kanal ara..',
                    channel_types: [ChannelType.GuildVoice],
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${memberVoiceChannel} kanalında bulunan ${inlineCode(
                        memberVoiceChannel.members.size.toString(),
                    )} adet üyenin taşınacağı kanalı seç.`,
                ),
            ],
            components: [row],
        });

        const filter = (i: ChannelSelectMenuInteraction) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60,
            componentType: ComponentType.ChannelSelect,
        });

        collector.on('collect', async (i: ChannelSelectMenuInteraction) => {
            const channel = message.guild.channels.cache.get(i.values[0]);

            message.member.voice.channel.members.forEach((b) => b.voice.setChannel(channel.id));

            question.edit({
                embeds: [
                    embed.setDescription(
                        `${memberVoiceChannel} kanalında bulunan üyeler ${channel} adlı kanala taşındı.`,
                    ),
                ],
                components: [],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default AllTransport;

import { ICommand } from '@/types';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    bold,
    inlineCode,
} from 'discord.js';

const AllMute: ICommand = {
    usages: ['allmute', 'muteall'],
    description: 'Tüm kullanıcıları susturur.',
    usableAuth: ['1179030512573091930'],
    execute: async ({ client, message }) => {
        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Bir ses kanalında bulunman gerekiyor.');
            return;
        }

        const channel = message.member.voice.channel;
        if (3 >= channel.members.size) {
            client.utils.sendTimedMessage(
                message,
                "Kanalda bulunan kullanıcı sayısı 3'ten az olduğu için işlem iptal edildi!",
            );
            return;
        }

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'mute',
                    label: 'Herkesi Sustur',
                    style: ButtonStyle.Secondary,
                    emoji: '1164692364900700171',
                }),
                new ButtonBuilder({
                    custom_id: 'unmute',
                    label: 'Susturmayı Kaldır',
                    style: ButtonStyle.Secondary,
                    emoji: '1155498150207959061',
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${channel} ${inlineCode(channel.id)} adlı kanalda sesteki kullanıcılara yapacağınız işlemi seçin.`,
                ),
            ],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i: ButtonInteraction) => {
            i.deferUpdate();
            if (i.customId === 'mute') {
                message.member.voice.channel.members
                    .filter((m) => m.id !== message.member.id && !m.voice.serverMute)
                    .forEach((m) => m.voice.setMute(true, message.author.displayName));

                message.channel.send({
                    embeds: [
                        embed.setDescription(
                            `${message.member.voice.channel} adlı kanaldaki herkesin konuşması ${bold(`kapatıldı`)}.`,
                        ),
                    ],
                });
            }

            if (i.customId === 'unmute') {
                message.member.voice.channel.members
                    .filter((m) => m.id !== message.member.id && m.voice && m.voice.serverMute)
                    .forEach((m) => m.voice.setMute(false, message.author.displayName));

                message.channel.send({
                    embeds: [
                        embed.setDescription(
                            `${message.member.voice.channel} adlı kanaldaki herkesin konuşması ${bold(`açıldı`)}.`,
                        ),
                    ],
                });
            }
        });
        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default AllMute;

import { MemberManager } from '@/managers';
import { ICommand } from '@/types';
import {
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    bold,
    inlineCode,
    ButtonInteraction,
} from 'discord.js';

const Go: ICommand = {
    usages: ['go', 'git'],
    description: 'Belirttiğiniz kullanıcının odasına gidersiniz.',
    execute: async ({ client, message, args }) => {
        if (client.cooldowns.has(message.author.id)) {
            client.utils.sendTimedMessage(message, 'Yapmış olduğun bir işlem var. Lütfen biraz bekle.');
            return;
        }

        if (!message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Komutu kullanmak için ses kanalında bulunmalısın.');
            return;
        }

        const member =
            (await MemberManager.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (member.id === message.author.id) {
            client.utils.sendTimedMessage(message, 'Bu komutu kendi üzerinde kullanamazsın!');
            return;
        }

        if (!member.voice.channelId) {
            client.utils.sendTimedMessage(message, `Belirttiğin kullanıcı adlı kullanıcı seste bulunmuyor!`);
            return;
        }

        if (member.voice.channelId === message.member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı ile aynı kanaldasın.');
            return;
        }

        const embed = new EmbedBuilder({
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({
                    forceStatic: true,
                }),
            },
            color: client.utils.getRandomColor(),
        });
        if (
            message.member.permissions.has(PermissionFlagsBits.MoveMembers) ||
            client.config.SERVER.TRANSPORT_AUTH.some((r) => message.member.roles.cache.has(r))
        ) {
            message.member.voice.setChannel(member.voice.channelId);
            message.reply({
                embeds: [
                    embed.setDescription(
                        `Başarıyla ${member} adlı üyeyinin ${inlineCode(
                            message.member.voice.channel.name,
                        )} adlı kanalın taşıdınız.`,
                    ),
                ],
            });
        } else {
            client.cooldowns.set(message.author.id, Date.now());

            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: 'accept',
                        label: 'Onaylıyorum',
                        style: ButtonStyle.Success,
                        emoji: {
                            id: '1054856853814788216',
                        },
                    }),
                    new ButtonBuilder({
                        custom_id: 'cancel',
                        label: 'Onaylamıyorum',
                        style: ButtonStyle.Danger,
                        emoji: {
                            id: '1057679211021746186',
                        },
                    }),
                ],
            });
            const question = await message.reply({
                content: member.toString(),
                embeds: [
                    embed.setDescription(
                        [
                            `${message.author} adlı üye seni ${inlineCode(
                                member.voice.channel.name,
                            )} kanalına gelmek istiyor. Onaylıyor musun?`,
                            `${bold('NOT:')} İşlem 30 saniye sonra iptal edilecektir.`,
                        ].join('\n'),
                    ),
                ],
                components: [row],
            });

            const filter = (i: ButtonInteraction) => i.user.id === member.id && i.isButton();
            const collector = question.createMessageComponentCollector({
                filter,
                time: 1000 * 30,
                componentType: ComponentType.Button,
            });

            collector.on('collect', async (i: ButtonInteraction) => {
                if (i.customId === 'accept') {
                    if (message.member.voice.channelId && member.voice.channelId)
                        message.member.voice.setChannel(member.voice.channelId);

                    question.edit({
                        content: ``,
                        embeds: [
                            embed.setDescription(
                                `${message.author} adlı kullanıcı ${member} adlı kullanıcının yanına taşındı.`,
                            ),
                        ],
                        components: [],
                    });
                }
                if (i.customId === 'cancel') {
                    client.cooldowns.delete(message.author.id);
                    question.edit({
                        content: ``,
                        embeds: [
                            embed.setDescription(
                                `${member} adlı kullanıcı ${message.author} adlı kullanıcının isteğini onaylamadığı için işlem iptal edildi.`,
                            ),
                        ],
                        components: [],
                    });
                }
            });

            collector.on('end', (_, reason) => {
                if (reason === 'time') {
                    client.cooldowns.delete(message.author.id);
                    question.edit({ components: [client.utils.timesUpButton()] });
                }
            });
        }
    },
};

export default Go;

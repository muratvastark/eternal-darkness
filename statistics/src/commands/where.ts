import { MemberManager, StatManager } from '@/managers';
import { ICommand } from '@/types';
import { EmbedBuilder, codeBlock, inlineCode, time } from 'discord.js';

const Where: ICommand = {
    usages: ['nerede', 'n'],
    description: 'Kullanıcı nerede?',
    execute: async ({ client, message, args }) => {
        const member = args.length
            ? (await MemberManager.getMember(message.guild, args[0])) ||
              (message.reference ? (await message.fetchReference()).member : undefined)
            : message.member;

        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (member.user.bot) {
            client.utils.sendTimedMessage(message, 'Botların verisi bulunamaz!');
            return;
        }

        if (!member.voice.channelId) {
            client.utils.sendTimedMessage(message, 'Kullanıcı seste bulunmuyor.');
            return;
        }

        const voiceCache = StatManager.voices.get(member.id);

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(member.id)}) adlı kullanıcı ${
                        member.voice.channel
                    } (${inlineCode(member.voice.channelId)}) adlı kanalda bulunuyor.`,
                    fields: [
                        {
                            name: 'Kullanıcı Bilgileri',
                            value: [
                                `Mikrofon Durumu: ${inlineCode(
                                    member.voice.mute
                                        ? member.voice.selfMute
                                            ? 'Kapalı!'
                                            : 'Kapalı! (Sunucu)'
                                        : 'Açık!',
                                )}`,
                                `Kulaklık Durumu: ${inlineCode(
                                    member.voice.deaf
                                        ? member.voice.selfDeaf
                                            ? 'Kapalı!'
                                            : 'Kapalı! (Sunucu)'
                                        : 'Açık!',
                                )}`,
                                `Ekran Durumu: ${inlineCode(member.voice.streaming ? 'Açık!' : 'Kapalı!')}`,
                                `Kamera Durumu: ${inlineCode(member.voice.selfVideo ? 'Açık!' : 'Kapalı!')}`,
                                `Doluluk Durumu: ${inlineCode(
                                    `${member.voice.channel.members.size}/${member.voice.channel.userLimit || '~'}`,
                                )}`,
                                `Kanala Giriş Zamanı: ${
                                    voiceCache ? time(Math.floor(voiceCache.joinedAt / 1000), 'R') : 'Bilinmiyor.'
                                }`,
                            ].join('\n'),
                            inline: false,
                        },
                        {
                            name: 'Seste Bulunan Kullanıcılar',
                            value: codeBlock(
                                'fix',
                                member.voice.channel.members
                                    .filter((m) => m.id !== member.id)
                                    .map((m) => m.user.displayName)
                                    .slice(0, 20)
                                    .join('\n'),
                            ),
                            inline: false,
                        },
                    ],
                }),
            ],
        });
    },
};

export default Where;

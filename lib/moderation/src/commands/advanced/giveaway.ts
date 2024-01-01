import { GiveawayManager } from '@/managers';
import { GiveawayModel } from '@/models';
import { ICommand } from '@/types';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionFlagsBits,
    bold,
    formatEmoji,
    time,
} from 'discord.js';
import ms from 'ms';

const Giveaway: ICommand = {
    usages: ['giveaway', 'g'],
    description: 'Çekiliş oluştur.',
    usableAuth: ['1179030512573091930'],
    async execute({ client, message, args }) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const duration = args.length ? ms(args[0]) : undefined;
        if (!duration) return client.utils.sendTimedMessage(message, 'Geçerli bir süre belirtmelisin.');

        const winnerCount = parseInt(args[1]);
        if (!winnerCount) return client.utils.sendTimedMessage(message, 'Geçerli bir kazanan sayısı belirtmelisin.');

        const prize = args.slice(2).join(' ');
        if (!prize) return client.utils.sendTimedMessage(message, 'Geçerli bir ödül belirtmelisin.');

        const giveawayEmojiId = '1186241287746224159';
        const giveawayEmoji = formatEmoji(giveawayEmojiId);
        const now = Date.now();
        const endTimestamp = now + duration;
        const giveawayButtonRow = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    customId: 'giveaway',
                    label: '0',
                    emoji: { id: giveawayEmojiId },
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        const msg = await message.channel.send({
            content: `${giveawayEmoji} ${bold('ÇEKİLİŞ')} ${giveawayEmoji}`,
            embeds: [
                new EmbedBuilder({
                    title: prize,
                    description: [
                        `Katılmak için ${giveawayEmoji} tıklayın!`,
                        `Süre: ${time(Math.floor(endTimestamp / 1000), 'R')} (${time(
                            Math.floor(endTimestamp / 1000),
                        )})`,
                        `Başlatan: ${message.author}\n`,
                        'Katılımcı Sayısı: 0',
                        'Son Katılan Üye: Katılan Üye Bulunmuyor.',
                    ].join('\n'),
                    footer: {
                        text: `Kazanacak Kişi Sayısı: ${winnerCount} | Bitiş Tarihi`,
                    },
                    timestamp: endTimestamp,
                }),
            ],
            components: [giveawayButtonRow],
        });

        GiveawayManager.create(message, endTimestamp, winnerCount, msg.id);
    },
};

export default Giveaway;

import { GiveawayModel } from '@/models';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Guild,
    Message,
    TextChannel,
    bold,
    formatEmoji,
    inlineCode,
    userMention,
} from 'discord.js';
import { MemberManager } from './MemberManager';

export class GiveawayManager {
    static giveaways: { channelId: string; messageId: string; endTimestamp: number }[] = [];

    static async init() {
        const giveaways = await GiveawayModel.find();
        GiveawayManager.giveaways = giveaways.map((g) => ({
            channelId: g.channelId,
            messageId: g.messageId,
            endTimestamp: g.endTimestamp,
        }));
    }

    static async create(message: Message, endTimestamp: number, winnerCount: number, msgId: string) {
        const giveaway = await GiveawayModel.create({
            channelId: message.channelId,
            endTimestamp,
            joiners: [],
            messageId: msgId,
            winnerCount,
        });
        GiveawayManager.giveaways.push({
            channelId: giveaway.channelId,
            messageId: giveaway.messageId,
            endTimestamp: giveaway.endTimestamp,
        });
    }

    static async checkGiveaways(guild: Guild) {
        if (!GiveawayManager.giveaways.length) return;

        const giveawayEmojiId = '1186241287746224159';
        const giveawayEmoji = formatEmoji(giveawayEmojiId);
        const now = Date.now();
        for (const giveaway of GiveawayManager.giveaways) {
            if (now - giveaway.endTimestamp === 1000 * 60 * 10) {
                const message = await (guild.channels.cache.get(giveaway.channelId) as TextChannel).messages.fetch(
                    giveaway.messageId,
                );

                message.edit({ content: `${giveawayEmoji} ${bold('KATILMAK İÇİN SON ŞANS')} ${giveawayEmoji}` });
                continue;
            }

            if (now >= giveaway.endTimestamp) {

                const document = await GiveawayModel.findOneAndRemove({ messageId: giveaway.messageId });
                if (!document) continue;

                const message = await (guild.channels.cache.get(giveaway.channelId) as TextChannel).messages.fetch(
                    giveaway.messageId,
                );

                const giveawayButtonRow = new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            customId: 'giveaway',
                            label: document.joiners.length.toString(),
                            emoji: { id: giveawayEmojiId },
                            style: ButtonStyle.Secondary,
                            disabled: true,
                        }),
                    ],
                });
                const winners = document.joiners.sort(() => Math.random() - 0.5).slice(0, document.winnerCount);
                const messageEmbed = message.embeds[0].data;
                const isShort = now - giveaway.endTimestamp >= 1000 * 60 * 60 * 12;

                const winnersContent = await Promise.all(
                    winners
                        .map(async (w) => {
                            if (isShort) return userMention(w);

                            const member = await MemberManager.getMember(guild, w);
                            return `${userMention(w)} ${
                                member.voice?.channelId
                                    ? `${member.voice.channel} isimli kanalda aktif!`
                                    : inlineCode(`Sesli kanallarda aktif değil!`)
                            }`;
                        })
                )

                message.edit({
                    content: `${giveawayEmoji} ${bold('ÇEKİLİŞ SONA ERDİ')} ${giveawayEmoji}`,
                    embeds: [
                        {
                            ...messageEmbed,
                            description: `${bold('Çekiliş Sona Erdi!')}\n${messageEmbed.description
                                .split('\n')
                                .slice(1, 3).join("\n")}\n\n${bold('Kazananlar:')}\n ${winnersContent.join('\n')}`,
                            footer: {
                                text: `Çekiliş sona erdi ${winners.length} kişi kazandı!`,
                            },
                            timestamp: undefined,
                        },
                    ],
                    components: [giveawayButtonRow],
                });

                await GiveawayModel.deleteOne({ messageId: giveaway.messageId });
                GiveawayManager.giveaways = GiveawayManager.giveaways.filter((g) => g.messageId !== giveaway.messageId);
            }
        }
    }
}

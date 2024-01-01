import { PenalFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import { bold, EmbedBuilder, inlineCode, userMention } from 'discord.js';

const BanInfo: ICommand = {
    usages: ['ban-info', 'baninfo', 'banbilgi', 'bilgiban', 'infoban', 'info-ban', 'ban-bilgi', 'bilgi-ban'],
    description: 'Sunucuda yasaklanan bir kullanıcının yasağını kaldırmadan bilgisini gösterir.',
    usableAuth: [
        '1179554150351122432',
        '1179885310323208242',
        '1179568339580891176',
        '1179030512573091930',
        '1179403561747095552',
        '1179554144130969713',
        '1179554128347803669',
        '1179554153362628669',
    ],
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const info = {
            staff: '',
            reason: '',
        };
        const ban = message.guild.bans.cache.get(user.id);
        if (!ban) {
            const penal = await PenalModel.findOne({ user: user.id, type: PenalFlags.Underworld, visible: true });
            if (!penal) {
                client.utils.sendTimedMessage(message, 'Kullanıcı yasaklı değil.');
                return;
            }
            info.staff = penal.admin;
            info.reason = penal.reason;
        } else {
            info.staff = 'Bilinmiyor.';
            info.reason = ban.reason || 'Sebep belirtilmemiş.';
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${user} (${inlineCode(user.id)}) adlı kullanıcı ${
                        info.staff ? `${userMention(info.staff)} (${inlineCode(info.staff)}) tarafından ` : ''
                    } ${bold(info.reason)} sebebiyle yasaklanmış`,
                }),
            ],
        });
    },
};

export default BanInfo;

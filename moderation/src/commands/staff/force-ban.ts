import { LimitFlags, PenalFlags } from '@/enums';
import { MemberManager, PenalManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const ForceBan: ICommand = {
    usages: ['yargı', 'açılmazban', 'açılmaz-ban', 'forceban', 'force-ban', 'muratva', 'cofteey'],
    description: 'Belirttiğiniz kullanıcının banını açılmaz olarak işaretlersiniz.',
    usableAuth: ['1179403561747095552'],
    execute: async ({ client, message, args }) => {
        if (message.member.roles.cache.has('1179403561747095552')) {
            const limit = MemberManager.checkLimit(message.author.id, LimitFlags.ForceBan, 5, 1000 * 60 * 10);
            if (limit.hasLimit) {
                client.utils.sendTimedMessage(
                    message,
                    `Atabileceğiniz maksimum susturma limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
                );
                return;
            }
        }

        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await MemberManager.getUser(client, args[0])) || reference;
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const member = await MemberManager.getMember(message.guild, user.id);
        if (member) {
            if (MemberManager.checkUser(client, message, member)) return;

            const ban = message.guild.bans.cache.get(user.id);
            if (ban) {
                client.utils.sendTimedMessage(message, 'Belirttiğin kişi zaten yok?');
                return;
            }
        }

        const reason = args.slice(reference ? 0 : 1).join(' ') || 'Sebep belirtilmemiş';
        message.guild.members.ban(user.id, { reason: `${message.author.username} - ${reason}` });

        await PenalModel.updateMany({ user: user.id }, { $set: { activity: false } });

        await PenalManager.createPenal({
            user: user.id,
            type: PenalFlags.ForceBan,
            admin: message.author.id,
            reason: reason,
            createdTimestamp: Date.now(),
        });

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    author: {
                        name: message.author.username,
                        icon_url: message.author.displayAvatarURL({ forceStatic: true }),
                    },
                    color: client.utils.getRandomColor(),
                    description: `${user} adlı orospu çocuğu sunucudan siktir edildi.`,
                }),
            ],
        });
    },
};

export default ForceBan;

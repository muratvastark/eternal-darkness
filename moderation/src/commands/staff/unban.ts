import { PenalFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import { bold, EmbedBuilder, inlineCode, TextChannel } from 'discord.js';

const Unban: ICommand = {
    usages: ['unban', 'ununderworld'],
    description: 'Yasaklı kullanıcının banını kaldırırsın.',
    usableAuth: [
        '1179566353984790549',
        '1179571587008184361',
        '1179403561747095552',
        '1179030512573091930',
        '1179554144130969713',
    ],
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await MemberManager.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (!member.roles.cache.has(client.config.SERVER.PENALS.UNDERWORLD.ROLE)) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        const penal = await PenalModel.findOne({ user: member.id, type: PenalFlags.Underworld });
        if (!penal || !penal.roles || !penal.roles.length)
            MemberManager.setRoles(member, client.config.SERVER.UNREGISTER_ROLE);
        else {
            await PenalModel.updateMany(
                { activity: true, user: member.id, type: PenalFlags.Underworld },
                { $set: { activity: false, remover: message.author.id, removeTime: Date.now(), removeReason: reason } },
            );
            MemberManager.setRoles(member, penal.roles);
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} kullanıcısının başarıyla cezası kaldırıldı.`,
                }),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === 'ban-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(member.id)}) adlı kullanıcının cezası ${
                        message.author
                    } (${inlineCode(message.author.id)}) tarafından ${bold(
                        reason,
                    )} sebebiyle süresi dolmadan kaldırıldı.`,
                }),
            ],
        });
    },
};

export default Unban;

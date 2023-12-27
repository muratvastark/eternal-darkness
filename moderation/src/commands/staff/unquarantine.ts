import { PenalFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import { bold, EmbedBuilder, inlineCode, TextChannel } from 'discord.js';

const Unquarantine: ICommand = {
    usages: ['unquarantine', 'unkarantina', 'kkarantina', 'uncezalı', 'unjail', 'cezalıaf', 'af'],
    description: 'Cezalı olan kullanıcının cezasını kaldırırsınız.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713', '1179568351253643375'],
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await MemberManager.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (!member.roles.cache.has(client.config.SERVER.PENALS.QUARANTINE.ROLE)) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        const penal = await PenalModel.findOne({ user: member.id, type: PenalFlags.Quarantine });
        if (!penal || !penal.roles || !penal.roles.length)
            MemberManager.setRoles(member, client.config.SERVER.UNREGISTER_ROLE);
        else {
            await PenalModel.updateMany(
                { activity: true, user: member.id, type: PenalFlags.Quarantine },
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

        const channel = message.guild.channels.cache.find((c) => c.name === 'quarantine-log') as TextChannel;
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

export default Unquarantine;

import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, bold } from 'discord.js';

const Invites: ICommand = {
    usages: ['invites', 'invite', 'inv', 'davet'],
    description: 'Belirtilen kullanıcıya ait davetleri gösterir.',
    execute: async ({ client, message, args }) => {
        const user = args.length
            ? (await MemberManager.getUser(client, args[0])) ||
              (message.reference ? (await message.fetchReference()).author : undefined)
            : message.author;

        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (user.bot) {
            client.utils.sendTimedMessage(message, 'Botların verisi bulunamaz!');
            return;
        }

        const document = await UserModel.findOne({ id: user.id });
        if (!document) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcının verisi bulunmuyor.');
            return;
        }

        const invitingUsers = await UserModel.find({ inviter: user.id });
        const now = Date.now();
        const weeklyTotal = invitingUsers.filter(
            (inv) =>
                message.guild.members.cache.has(inv.id) &&
                1000 * 60 * 60 * 24 * 7 >= now - message.guild.members.cache.get(inv.id).joinedTimestamp,
        ).length;

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: user.username,
                icon_url: user.displayAvatarURL({ forceStatic: true }),
            },
            description: `Toplam ${bold(document.normalInvites.toString())} daveti bulunuyor. (${bold(
                document.normalInvites.toString(),
            )} normal, ${bold(document.leaveInvites.toString())} ayrılan, ${bold(weeklyTotal.toString())} haftalık)`,
        });

        message.channel.send({ embeds: [embed] });
    },
};

export default Invites;

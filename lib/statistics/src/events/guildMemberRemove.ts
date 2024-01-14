import { UserModel } from '@/models';
import { IEvent } from '@/types';
import { Events, TextChannel, bold, inlineCode } from 'discord.js';

const GuildMemberRemove: IEvent<Events.GuildMemberRemove> = {
    name: Events.GuildMemberRemove,
    execute: async (client, member) => {
        if (member.user.bot) return;

        const logChannel = member.guild.channels.cache.find((c) => c.name === 'invite-log') as TextChannel;

        const memberData = await UserModel.findOne({ id: member.id });
        if (!memberData || !memberData.inviter) {
            if (logChannel) logChannel.send({
                content: `${member} üyesi sunucumuzdan ayrıldı. ${bold('ÖZEL URL')} tarafından davet edilmişti.`,
            });
            return;
        }

        const inviterData = await UserModel.findOne({ id: memberData.inviter });
        if (!inviterData) {
            if (logChannel) logChannel.send({
                content: `${member} üyesi sunucumuzdan ayrıldı. Kim tarafından davet edildiği bulunamadı.`,
            });
            return;
        }

        memberData.inviter = undefined;
        memberData.markModified('inviter');
        memberData.save();

        const inviter = await client.users.fetch(inviterData.id);
        if (inviterData.normalInvites > 0) inviterData.normalInvites -= 1;
        inviterData.leaveInvites += 1;
        inviterData.markModified('leaveInvites normalInvites');
        inviterData.save();
        if (logChannel) logChannel.send({
            content: `${member} üyesi sunucumuzdan ayrıldı. ${inlineCode(
                inviter.username,
            )} tarafından davet edilmişti bu kişinin toplam (${bold(`${inviterData.normalInvites}`)}) daveti oldu.`,
        });
        return;
    },
};

export default GuildMemberRemove;

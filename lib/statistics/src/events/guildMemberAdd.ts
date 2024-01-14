import { StatManager } from '@/managers';
import { UserModel } from '@/models';
import { IEvent } from '@/types';
import { Events, TextChannel, bold, inlineCode } from 'discord.js';

const GuildMemberAdd: IEvent<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    execute: async (_, member) => {
        if (member.user.bot) return;

        const logChannel = member.guild.channels.cache.find((c) => c.name === 'invite-log') as TextChannel;
        const invites = await member.guild.invites.fetch();
        const notHasInvite = StatManager.invites.find((i) => !invites.has(i.code));
        const invite =
            invites.find((i) => StatManager.invites.has(i.code) && i.uses > StatManager.invites.get(i.code).uses) ||
            notHasInvite;
        const isSuspect = 1000 * 60 * 60 * 24 * 7 >= Date.now() - member.user.createdTimestamp;
        if (!invite || !invite.inviter) {
            if (logChannel) logChannel.send(`${member} üyesi sunucumuza ${bold('ÖZEL URL')} tarafından davet edildi.`);
            return;
        }

        if (notHasInvite) StatManager.invites.delete(invite.code);
        else StatManager.invites.set(invite.code, { code: invite.code, inviter: invite.inviter, uses: invite.uses });

        await UserModel.updateOne({ id: member.id }, { $set: { inviter: invite.inviter.id } }, { upsert: true });

        const document = await UserModel.findOneAndUpdate(
            { id: invite.inviter.id },
            { $inc: { normalInvites: isSuspect ? 0 : 1 } },
            { upsert: true, new: true },
        );
        if (logChannel) logChannel.send({
            content: `${member} üyesi sunucumuza katıldı. ${inlineCode(
                invite.inviter.username,
            )} tarafından davet edildi, ve bu kişinin toplam davet sayısı (${bold(`${document.normalInvites}`)}) oldu ${
                isSuspect ? '🚫' : ''
            }`,
        });
    },
};

export default GuildMemberAdd;

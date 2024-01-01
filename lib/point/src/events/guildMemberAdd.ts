import { MemberManager, StaffManager } from '@/managers';
import { StaffModel } from '@/models';
import { IEvent } from '@/types';
import { Events } from 'discord.js';

const GuildMemberAdd: IEvent<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    execute: async (_, member) => {
        if (member.user.bot) return;

        const invites = await member.guild.invites.fetch();
        const notHasInvite = StaffManager.invites.find((i) => !invites.has(i.code));
        const invite =
            invites.find((i) => StaffManager.invites.has(i.code) && i.uses > StaffManager.invites.get(i.code).uses) ||
            notHasInvite;
        if (!invite || !invite.inviter || 1000 * 60 * 60 * 24 * 7 >= Date.now() - member.user.createdTimestamp) return;

        if (notHasInvite) StaffManager.invites.delete(invite.code);
        else StaffManager.invites.set(invite.code, { code: invite.code, inviter: invite.inviter, uses: invite.uses });

        const inviteMember = await MemberManager.getMember(member.guild, invite.inviter.id);
        if (!inviteMember || !StaffManager.checkStaff(inviteMember)) return;

        await StaffModel.updateOne(
            { id: invite.inviter.id },
            { $push: { invitedUsers: member.id } },
            { upsert: true, new: true },
        );
    },
};

export default GuildMemberAdd;

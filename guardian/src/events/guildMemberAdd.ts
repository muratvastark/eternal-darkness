import { GuardManager, MemberManager } from '@/managers';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, inlineCode } from 'discord.js';

const GuildMemberAdd: IEvent<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    execute: async (client, member) => {
        if (!member.user.bot) return;
        const entry = await getEntry(member.guild);
        if (!entry) return;

        if (client.config.SERVER.JAIL_ROLE) {
            await MemberManager.setRoles(
                member.guild.members.cache.get(entry.executorId),
                client.config.SERVER.JAIL_ROLE,
            );
        } else await member.guild.members.ban(entry.executorId);

        await member.guild.members.ban(member.id);

        await GuardManager.closePermissions(member.guild);
        GuardManager.sendPunishLog({
            guild: member.guild,
            action: 'ekledi',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${member} (${inlineCode(member.id)})`,
            targetType: 'bot',
        });
    },
};

export default GuildMemberAdd;

async function getEntry(guild: Guild) {
    const entry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd })
        .then((audit) => audit.entries.first());
    return entry && entry.executor && !entry.executor.bot && 5000 > Date.now() - entry.createdTimestamp ? entry : null;
}

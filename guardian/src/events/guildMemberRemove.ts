import { LimitFlags } from '@/enums';
import { GuardManager, MemberManager } from '@/managers';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, inlineCode } from 'discord.js';
import ms from 'ms';

const GuildMemberRemove: IEvent<Events.GuildMemberRemove> = {
    name: Events.GuildMemberRemove,
    execute: async (client, member) => {
        const entry = await getEntry(member.guild);
        if (!entry) return;

        const staffMember = member.guild.members.cache.get(entry.executorId);
        const safe = client.config.SERVER.SAFES.find(
            (s) => s.ID === staffMember.id || staffMember.roles.cache.has(s.ID),
        );
        if (safe && safe.ADMIN) return;

        const isLimited = safe && safe.BAN_KICK_LIMIT.COUNT > 0 && safe.BAN_KICK_LIMIT.TIME;
        if (isLimited) {
            const limit = GuardManager.checkLimits({
                userId: entry.executor.id,
                limit: safe.BAN_KICK_LIMIT.COUNT,
                time: ms(safe.BAN_KICK_LIMIT.TIME as string),
                type: LimitFlags.BanKick,
            });
            if (limit && limit.isWarn) {
                GuardManager.sendLimitWarning({
                    guild: member.guild,
                    authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
                    currentCount: limit.currentCount,
                    maxCount: limit.maxCount,
                    type: 'kick & ban',
                });
                return;
            }
        }

        if (client.config.SERVER.JAIL_ROLE) await MemberManager.setRoles(staffMember, client.config.SERVER.JAIL_ROLE);
        else await member.guild.members.ban(entry.executor.id);

        await GuardManager.closePermissions(member.guild);

        GuardManager.sendPunishLog({
            guild: member.guild,
            action: isLimited ? 'atarak limite ulaştı' : 'attı',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${member} (${inlineCode(member.id)})`,
            targetType: 'üyeyi',
        });
    },
};

export default GuildMemberRemove;

async function getEntry(guild: Guild) {
    const now = Date.now();
    const kickEntry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick })
        .then((audit) => audit.entries.first());
    if (kickEntry && kickEntry.executor && !kickEntry.executor.bot && 5000 > now - kickEntry.createdTimestamp) {
        return kickEntry;
    }

    const pruneEntry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberPrune })
        .then((audit) => audit.entries.first());
    if (pruneEntry && pruneEntry.executor && !pruneEntry.executor.bot && 5000 > now - pruneEntry.createdTimestamp) {
        return pruneEntry;
    }

    return null;
}

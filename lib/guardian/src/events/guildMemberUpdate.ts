import { LimitFlags } from '@/enums';
import { GuardManager, MemberManager } from '@/managers';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, inlineCode } from 'discord.js';
import ms from 'ms';

const GuildMemberUpdate: IEvent<Events.GuildMemberUpdate> = {
    name: Events.GuildMemberUpdate,
    execute: async (client, oldMember, newMember) => {
        if (!GuardManager.dangerPerms.some((d) => !oldMember.permissions.has(d) && newMember.permissions.has(d)))
            return;

        const entry = await getEntry(oldMember.guild);
        if (!entry) return;

        const staffMember = oldMember.guild.members.cache.get(entry.executorId);
        const safe = client.config.SERVER.SAFES.find(
            (s) => s.ID === staffMember.id || staffMember.roles.cache.has(s.ID),
        );
        if (safe && safe.ADMIN) return;

        const isLimited = safe && safe.MEMBER_ROLE_LIMIT.COUNT > 0 && safe.MEMBER_ROLE_LIMIT.TIME;
        if (isLimited) {
            const limit = GuardManager.checkLimits({
                userId: entry.executor.id,
                limit: safe.MEMBER_ROLE_LIMIT.COUNT,
                time: ms(safe.MEMBER_ROLE_LIMIT.TIME as string),
                type: LimitFlags.Channel,
            });
            if (limit && limit.isWarn) {
                GuardManager.sendLimitWarning({
                    guild: newMember.guild,
                    authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
                    currentCount: limit.currentCount,
                    maxCount: limit.maxCount,
                    type: 'rol ekleme',
                });
                return;
            }
        }

        if (client.config.SERVER.JAIL_ROLE) await MemberManager.setRoles(staffMember, client.config.SERVER.JAIL_ROLE);
        else await newMember.guild.members.ban(entry.executor.id);

        await MemberManager.setRoles(
            newMember,
            oldMember.roles.cache
                .filter((r) => !GuardManager.dangerPerms.some((p) => r.permissions.has(p)))
                .map((r) => r.id),
        );

        await GuardManager.closePermissions(oldMember.guild);

        GuardManager.sendPunishLog({
            guild: oldMember.guild,
            action: isLimited ? 'rollerini güncelledi' : 'banladı',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${oldMember} (${inlineCode(oldMember.user.id)})`,
            targetType: 'üyeyi',
        });
    },
};

export default GuildMemberUpdate;

async function getEntry(guild: Guild) {
    const entry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate })
        .then((audit) => audit.entries.first());

    return entry && entry.executor && !entry.executor.bot && 5000 > Date.now() - entry.createdTimestamp ? entry : null;
}

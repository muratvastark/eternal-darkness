import { LimitFlags } from '@/enums';
import { GuardManager, MemberManager } from '@/managers';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, inlineCode } from 'discord.js';
import ms from 'ms';

const GuildRoleCreate: IEvent<Events.GuildRoleCreate> = {
    name: Events.GuildRoleCreate,
    execute: async (client, role) => {
        const entry = await getEntry(role.guild);
        if (!entry) return;

        const staffMember = role.guild.members.cache.get(entry.executorId);
        const safe = client.config.SERVER.SAFES.find(
            (s) => s.ID === staffMember.id || staffMember.roles.cache.has(s.ID),
        );
        if (safe && safe.ADMIN) return;

        const isLimited = safe && safe.ROLE_LIMIT.COUNT > 0 && safe.ROLE_LIMIT.TIME;
        if (isLimited) {
            const limit = GuardManager.checkLimits({
                userId: entry.executor.id,
                limit: safe.ROLE_LIMIT.COUNT,
                time: ms(safe.ROLE_LIMIT.TIME as string),
                type: LimitFlags.Role,
            });
            if (limit && limit.isWarn) {
                GuardManager.sendLimitWarning({
                    guild: role.guild,
                    authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
                    currentCount: limit.currentCount,
                    maxCount: limit.maxCount,
                    type: 'rol',
                });
                return;
            }
        }

        if (client.config.SERVER.JAIL_ROLE) await MemberManager.setRoles(staffMember, client.config.SERVER.JAIL_ROLE);
        else await role.guild.members.ban(entry.executor.id);

        await GuardManager.closePermissions(role.guild);
        await role.delete();

        GuardManager.sendPunishLog({
            guild: role.guild,
            action: isLimited ? 'oluşturarak limite ulaştı' : 'oluşturdu',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${role.name} (${inlineCode(role.id)})`,
            targetType: 'rolü',
        });
    },
};

export default GuildRoleCreate;

async function getEntry(guild: Guild) {
    const entry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate })
        .then((audit) => audit.entries.first());
    return entry && entry.executor && !entry.executor.bot && 5000 > Date.now() - entry.createdTimestamp ? entry : null;
}

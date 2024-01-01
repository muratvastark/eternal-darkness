import { LimitFlags } from '@/enums';
import { GuardManager, MemberManager } from '@/managers';
import { RoleModel } from '@/models';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, inlineCode } from 'discord.js';
import ms from 'ms';

const GuildRoleUpdate: IEvent<Events.GuildRoleUpdate> = {
    name: Events.GuildRoleUpdate,
    execute: async (client, oldRole, newRole) => {
        const entry = await getEntry(oldRole.guild);
        if (!entry) return;

        const staffMember = oldRole.guild.members.cache.get(entry.executorId);
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
                    guild: oldRole.guild,
                    authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
                    currentCount: limit.currentCount,
                    maxCount: limit.maxCount,
                    type: 'rol',
                });
                return;
            }
        }

        if (client.config.SERVER.JAIL_ROLE) await MemberManager.setRoles(staffMember, client.config.SERVER.JAIL_ROLE);
        else await oldRole.guild.members.ban(entry.executor.id);

        await GuardManager.closePermissions(oldRole.guild);

        const document = await RoleModel.findOne({ id: newRole.id });
        if (document) {
            newRole.edit({
                name: document.name,
                color: document.color,
                position: document.position,
                permissions: BigInt(document.permissions),
                icon: document.icon,
                mentionable: document.mentionable,
                hoist: document.hoist,
            });
            if (document.icon) newRole.setIcon(Buffer.from(document.icon, 'base64'));
        }

        GuardManager.sendPunishLog({
            guild: oldRole.guild,
            action: isLimited ? 'düzenleyerek limite ulaştı' : 'düzenleyerek',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${oldRole.name} (${inlineCode(oldRole.id)})`,
            targetType: 'rolü',
        });
    },
};

export default GuildRoleUpdate;

async function getEntry(guild: Guild) {
    const entry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate })
        .then((audit) => audit.entries.first());
    return entry && entry.executor && !entry.executor.bot && 5000 > Date.now() - entry.createdTimestamp ? entry : null;
}

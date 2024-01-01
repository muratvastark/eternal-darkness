import { LimitFlags } from '@/enums';
import { GuardManager, MemberManager } from '@/managers';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, inlineCode } from 'discord.js';
import ms from 'ms';

const GuildBanAdd: IEvent<Events.GuildBanAdd> = {
    name: Events.GuildBanAdd,
    execute: async (client, ban) => {
        const entry = await getEntry(ban.guild);
        if (!entry) return;

        const staffMember = ban.guild.members.cache.get(entry.executorId);
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
                    guild: ban.guild,
                    authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
                    currentCount: limit.currentCount,
                    maxCount: limit.maxCount,
                    type: 'kick & ban',
                });
                return;
            }
        }

        if (client.config.SERVER.JAIL_ROLE) await MemberManager.setRoles(staffMember, client.config.SERVER.JAIL_ROLE);
        else await ban.guild.members.ban(entry.executor.id);
        await GuardManager.closePermissions(ban.guild);

        GuardManager.sendPunishLog({
            guild: ban.guild,
            action: isLimited ? 'yasakladı ve limite ulaştı' : 'banladı',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${ban.user} (${inlineCode(ban.user.id)})`,
            targetType: 'üyeyi',
        });
    },
};

export default GuildBanAdd;

async function getEntry(guild: Guild) {
    const entry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd })
        .then((audit) => audit.entries.first());

    return entry && entry.executor && !entry.executor.bot && 5000 > Date.now() - entry.createdTimestamp ? entry : null;
}

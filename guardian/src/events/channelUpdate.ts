import { LimitFlags } from '@/enums';
import { GuardManager, MemberManager } from '@/managers';
import { ChannelModel } from '@/models';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, GuildChannel, inlineCode } from 'discord.js';
import ms from 'ms';

const ChannelUpdate: IEvent<Events.ChannelUpdate> = {
    name: Events.ChannelUpdate,
    execute: async (client, oldChannel, newChannel) => {
        if (oldChannel.isDMBased() || oldChannel.isThread()) return;

        const entry = await getEntry(oldChannel.guild);
        if (!entry) return;

        const staffMember = oldChannel.guild.members.cache.get(entry.executorId);
        const safe = client.config.SERVER.SAFES.find(
            (s) => s.ID === staffMember.id || staffMember.roles.cache.has(s.ID),
        );
        if (safe && safe.ADMIN) return;

        const isLimited = safe && safe.CHANNEL_LIMIT.COUNT > 0 && safe.CHANNEL_LIMIT.TIME;
        if (isLimited) {
            const limit = GuardManager.checkLimits({
                userId: entry.executor.id,
                limit: safe.CHANNEL_LIMIT.COUNT,
                time: ms(safe.CHANNEL_LIMIT.TIME as string),
                type: LimitFlags.Channel,
            });
            if (limit && limit.isWarn) {
                GuardManager.sendLimitWarning({
                    guild: oldChannel.guild,
                    authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
                    currentCount: limit.currentCount,
                    maxCount: limit.maxCount,
                    type: 'kanal',
                });
                return;
            }
        }

        if (client.config.SERVER.JAIL_ROLE) await MemberManager.setRoles(staffMember, client.config.SERVER.JAIL_ROLE);
        else await oldChannel.guild.members.ban(entry.executor.id);

        await GuardManager.closePermissions(oldChannel.guild);

        const document = await ChannelModel.findOne({ id: newChannel.id });
        if (document) {
            (newChannel as GuildChannel).edit({
                name: document.name,
                parent: document.parentId,
                lockPermissions: false,
                permissionOverwrites: document.permissions.map((p) => ({
                    id: p.id,
                    type: p.type,
                    permissions: p.permissions,
                })),
                position: document.position,
            });
        }

        GuardManager.sendPunishLog({
            guild: oldChannel.guild,
            action: isLimited ? 'düzenleyerek limite ulaştı' : 'düzenleyerek',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${oldChannel.name} (${inlineCode(oldChannel.id)})`,
            targetType: 'kanalı',
        });
    },
};

export default ChannelUpdate;

async function getEntry(guild: Guild) {
    const now = Date.now();
    const channelEntry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate })
        .then((audit) => audit.entries.first());
    if (
        channelEntry &&
        channelEntry.executor &&
        !channelEntry.executor.bot &&
        5000 > now - channelEntry.createdTimestamp
    ) {
        return channelEntry;
    }

    const overwriteEntry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelOverwriteUpdate })
        .then((audit) => audit.entries.first());
    if (
        overwriteEntry &&
        overwriteEntry.executor &&
        !overwriteEntry.executor.bot &&
        5000 > now - overwriteEntry.createdTimestamp
    ) {
        return overwriteEntry;
    }

    return null;
}

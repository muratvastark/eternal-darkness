import { LimitFlags } from '@/enums';
import { GuardManager, MemberManager } from '@/managers';
import { ChannelModel } from '@/models';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, inlineCode } from 'discord.js';
import ms from 'ms';

const ChannelDelete: IEvent<Events.ChannelDelete> = {
    name: Events.ChannelDelete,
    execute: async (client, channel) => {
        if (channel.isDMBased() || channel.isThread()) return;

        const now = Date.now();
        const entry = await getEntry(channel.guild);
        if (!entry) return;

        const staffMember = channel.guild.members.cache.get(entry.executorId);
        const safe = client.config.SERVER.SAFES.find(
            (s) => s.ID === staffMember.id || staffMember.roles.cache.has(s.ID),
        );
        if (safe && safe.ADMIN) {
            await ChannelModel.updateOne({ id: channel.id }, { $set: { isDeleted: true, deletedTimestamp: now } });
            return;
        }

        const isLimited = safe && safe.CHANNEL_LIMIT.COUNT > 0 && safe.CHANNEL_LIMIT.TIME;
        if (isLimited) {
            await ChannelModel.updateOne({ id: channel.id }, { $set: { isDeleted: true, deletedTimestamp: now } });

            const limit = GuardManager.checkLimits({
                userId: entry.executor.id,
                limit: safe.CHANNEL_LIMIT.COUNT,
                time: ms(safe.CHANNEL_LIMIT.TIME as string),
                type: LimitFlags.Channel,
            });
            if (limit && limit.isWarn) {
                GuardManager.sendLimitWarning({
                    guild: channel.guild,
                    authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
                    currentCount: limit.currentCount,
                    maxCount: limit.maxCount,
                    type: 'kanal',
                });
                return;
            }
        }

        if (client.config.SERVER.JAIL_ROLE) await MemberManager.setRoles(staffMember, client.config.SERVER.JAIL_ROLE);
        else await channel.guild.members.ban(entry.executor.id);

        await GuardManager.closePermissions(channel.guild);

        const document = await ChannelModel.findOneAndUpdate({ id: channel.id }, { $set: { isDeleted: true, deletedTimestamp: now } });
        if (document) {
            if (entry.action === AuditLogEvent.ChannelDelete) GuardManager.createChannel(channel.guild, document);
            else {
                document.permissions
                    .filter((p) => channel.guild.roles.cache.has(p.id) || channel.guild.members.cache.has(p.id))
                    .forEach((p) => channel.permissionOverwrites.create(p.id, p.permissions));
            }
        }

        GuardManager.sendPunishLog({
            guild: channel.guild,
            action: isLimited ? 'silerek limite ulaştı' : 'oluşturdu',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${channel.name} (${inlineCode(channel.id)})`,
            targetType: 'kanalı',
        });
    },
};

export default ChannelDelete;

async function getEntry(guild: Guild) {
    const now = Date.now();
    const channelEntry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete })
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
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelOverwriteDelete })
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

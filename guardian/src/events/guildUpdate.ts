import { GuardManager, MemberManager } from '@/managers';
import { IEvent } from '@/types';
import { AuditLogEvent, Events, Guild, inlineCode } from 'discord.js';

const GuildUpdate: IEvent<Events.GuildUpdate> = {
    name: Events.GuildUpdate,
    execute: async (client, oldGuild, newGuild) => {
        const entry = await getEntry(newGuild);
        if (!entry) return;

        if (client.config.SERVER.JAIL_ROLE) {
            await MemberManager.setRoles(oldGuild.members.cache.get(entry.executorId), client.config.SERVER.JAIL_ROLE);
        } else await oldGuild.members.ban(entry.executorId);

        await GuardManager.closePermissions(oldGuild);
        newGuild.edit(GuardManager.guildSettings);

        GuardManager.sendPunishLog({
            guild: newGuild,
            action: 'değiştirdi',
            authorName: `${entry.executor} (${inlineCode(entry.executorId)})`,
            targetName: `${newGuild.name} (${inlineCode(newGuild.id)})`,
            targetType: 'sunucu ayarlarını',
        });
    },
};

export default GuildUpdate;

async function getEntry(guild: Guild) {
    const entry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.GuildUpdate })
        .then((audit) => audit.entries.first());
    return entry && entry.executor && !entry.executor.bot && 5000 > Date.now() - entry.createdTimestamp ? entry : null;
}

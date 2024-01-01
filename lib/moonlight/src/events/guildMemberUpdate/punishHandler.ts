import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { Client } from '@/base';
import { AuditLogEvent, EmbedBuilder, Guild, GuildMember, TextChannel, inlineCode } from 'discord.js';
import { MemberManager } from '@/managers';

async function punishHandler(client: Client, oldMember: GuildMember, newMember: GuildMember) {
    if (
        oldMember.roles.cache.map((r) => r.id) === newMember.roles.cache.map((r) => r.id) ||
        ![
            client.config.SERVER.UNREGISTER_ROLE,
            client.config.SERVER.UNDERWORLD_ROLE,
            client.config.SERVER.QUARANTINE_ROLE,
            client.config.SERVER.CHAT_MUTE_ROLE,
            client.config.SERVER.VOICE_MUTE_ROLE,
        ].some((r) => oldMember.roles.cache.has(r) && !newMember.roles.cache.has(r))
    )
        return;

    const penals = await PenalModel.find({ user: newMember.id, activity: true }).select('type');
    if (!penals.length) return;

    const channel = newMember.guild.channels.cache.find((c) => c.name === 'unfinished-penals') as TextChannel;
    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
    });

    const entry = await getEntry(newMember.guild, newMember.id);
    if (!entry || !entry.executor || entry.executor.bot) return;

    if (penals.some((p) => p.type === PenalFlags.Underworld)) {
        MemberManager.setRoles(newMember, client.config.SERVER.UNDERWORLD_ROLE);

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        `${newMember} (${inlineCode(newMember.id)}) adlı kullanıcının yasaklama cezası ${
                            entry.executor
                        } (${inlineCode(entry.executorId)}) tarafından kaldırılmaya çalışıldı.`,
                    ),
                ],
            });
        }
        return;
    }

    if (penals.some((p) => p.type === PenalFlags.Quarantine)) {
        MemberManager.setRoles(newMember, client.config.SERVER.QUARANTINE_ROLE);

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        `${newMember} (${inlineCode(newMember.id)}) adlı kullanıcının cezalısı ${
                            entry.executor
                        } (${inlineCode(entry.executorId)}) tarafından kaldırılmaya çalışıldı.`,
                    ),
                ],
            });
        }
        return;
    }

    const roles: string[] = [];
    let type: string;
    if (penals.some((p) => p.type === PenalFlags.ChatMute)) {
        roles.push(client.config.SERVER.CHAT_MUTE_ROLE);
        type = 'yazı cezası';
    }
    if (penals.some((p) => p.type === PenalFlags.VoiceMute)) {
        roles.push(client.config.SERVER.VOICE_MUTE_ROLE);
        type = 'ses cezası';
    }

    if (roles.length) {
        newMember.roles.add(roles);

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        `${newMember} (${inlineCode(newMember.id)}) adlı kullanıcının ${type} ${
                            entry.executor
                        } (${inlineCode(entry.executorId)}) tarafından kaldırılmaya çalışıldı.`,
                    ),
                ],
            });
        }
    }
}

export default punishHandler;

async function getEntry(guild: Guild, memberId: string) {
    const lastEntry = await guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate })
        .then((audit) => audit.entries.first());
    return lastEntry &&
        lastEntry.executor &&
        5000 > Date.now() - lastEntry.createdTimestamp &&
        lastEntry.targetId === memberId
        ? lastEntry
        : null;
}

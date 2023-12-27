import { RoleLogFlags } from '@/enums';
import { UserModel } from '@/models';
import { AuditLogEvent, GuildMember, TextChannel, EmbedBuilder, Colors, inlineCode, time } from 'discord.js';

async function roleLog(oldMember: GuildMember, newMember: GuildMember) {
    if (oldMember.roles.cache.map((r) => r.id) === newMember.roles.cache.map((r) => r.id)) return;

    const entry = await newMember.guild
        .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate })
        .then((audit) => audit.entries.first());
    if (
        !entry ||
        !entry.executor ||
        entry.executor.bot ||
        entry.targetId !== newMember.id ||
        Date.now() - entry.createdTimestamp > 5000
    )
        return;

    const role = oldMember.roles.cache.difference(newMember.roles.cache).first();
    const isRemove = oldMember.roles.cache.size > newMember.roles.cache.size;
    const now = Date.now();

    await UserModel.updateOne(
        { id: newMember.id },
        {
            $push: {
                roleLogs: {
                    type: isRemove ? RoleLogFlags.RemoveAdmin : RoleLogFlags.AddAdmin,
                    roles: [role.id],
                    time: now,
                    admin: entry.executorId,
                },
            },
        },
        { upsert: true },
    );

    const channel = newMember.guild.channels.cache.find((c) => c.name === 'role-log') as TextChannel;
    if (!channel) return;

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: isRemove ? Colors.Red : Colors.Green,
                title: `Rol ${isRemove ? 'Çıkarıldı' : 'Eklendi'}! (Sağ Tık)`,
                fields: [
                    { name: 'Kullanıcı', value: `${newMember} (${inlineCode(newMember.id)})`, inline: true },
                    {
                        name: 'Yetkili',
                        value: `${entry.executor} (${inlineCode(entry.executorId)})`,
                        inline: true,
                    },
                    { name: 'Tarih', value: time(Math.floor(Date.now() / 1000), 'R'), inline: true },
                    {
                        name: 'İşlem Yapılan Rol',
                        value: role.toString(),
                        inline: false,
                    },
                ],
            }),
        ],
    });
}

export default roleLog;

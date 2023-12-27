import { Client } from '@/base';
import { RoleManager } from '@/managers';
import { EmbedBuilder, GuildMember, TextChannel, User, codeBlock, inlineCode } from 'discord.js';
async function tagHandler(client: Client, oldUser: User, newUser: User, member: GuildMember) {
    if (
        ![
            ...client.config.SERVER.MAN_ROLES,
            ...client.config.SERVER.WOMAN_ROLES,
            client.config.SERVER.REGISTERED_ROLE,
        ].some((role) => member.roles.cache.has(role))
    )
        return;

    const oldHasTag = oldUser.displayName.includes(client.config.SERVER.TAG);
    const newHasTag = newUser.displayName.includes(client.config.SERVER.TAG);
    const tagMemberCount = member.guild.members.cache.filter((m) =>
        m.user.displayName.includes(client.config.SERVER.TAG),
    );
    const channel = member.guild.channels.cache.find((c) => c.name === 'tag-log') as TextChannel;
    const now = Date.now();
    const embed = new EmbedBuilder({ color: client.utils.getRandomColor(), timestamp: now });

    if (!oldHasTag && newHasTag) {
        member.setNickname(member.displayName.replace(client.config.SERVER.UNTAGGED_TAG, client.config.SERVER.TAG));
        member.roles.add(client.config.SERVER.FAMILY_ROLE);

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        [
                            `${member} (${inlineCode(member.id)}) kullanıcısı tagımızı alarak aramıza katıldı!`,
                            codeBlock('fix', `Mevcut isminde tag bulunan üye sayımız: ${tagMemberCount.size}`),
                        ].join('\n'),
                    ),
                ],
            });
        }
    }

    if (oldHasTag && !newHasTag) {
        const botCommandRole = member.guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        if (member.roles.highest.position >= botCommandRole.position) {
            RoleManager.sendStaffText(client, member, 'tagı isminden çıkardı', member.roles.cache.filter((r) => botCommandRole.position <= r.position && !r.managed));
            await member.roles.set(member.roles.cache.filter((r) => botCommandRole.position > r.position && !r.managed));
        }

        member.roles.remove(client.config.SERVER.FAMILY_ROLE);
        member.setNickname(member.displayName.replace(client.config.SERVER.TAG, client.config.SERVER.UNTAGGED_TAG));

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        [
                            `${member} (${inlineCode(member.id)}) kullanıcısı tagımızı bırakarak aramızdan ayrıldı!`,
                            codeBlock('fix', `Mevcut isminde tag bulunan üye sayımız: ${tagMemberCount.size}`),
                        ].join('\n'),
                    ),
                ],
            });
        }
    }
}

export default tagHandler;

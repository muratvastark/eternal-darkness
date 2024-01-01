import { Client } from '@/base';
import { EmbedBuilder, GuildMember, TextChannel, User, codeBlock, inlineCode } from 'discord.js';
import { MemberManager, RoleManager } from '@/managers';

async function bannedTagHandler(client: Client, oldUser: User, newUser: User, member: GuildMember) {
    const channel = member.guild.channels.cache.find((c) => c.name === 'banned-tag-log') as TextChannel;
    const now = Date.now();
    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
        timestamp: now,
    });
    const tag = client.config.SERVER.BANNED_TAGS.find((t) =>
        newUser.displayName.toLowerCase().includes(t.toLowerCase()),
    );
    const bannedTagMemberCount = member.guild.members.cache.filter((m) =>
        client.config.SERVER.BANNED_TAGS.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())),
    );
    const bannedTagsMemberCount = member.guild.members.cache.filter((m) =>
        m.roles.cache.has(client.config.SERVER.BANNED_TAG_ROLE),
    );
    const oldHasTag = client.config.SERVER.BANNED_TAGS.some((t) =>
        oldUser.displayName.toLowerCase().includes(t.toLowerCase()),
    );
    const newHasTag = client.config.SERVER.BANNED_TAGS.some((t) =>
        newUser.displayName.toLowerCase().includes(t.toLowerCase()),
    );

    if (!oldHasTag && newHasTag) {
        const botCommandRole = member.guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        if (member.roles.highest.position >= botCommandRole.position) {
            const staffRoles = member.roles.cache.filter((r) => r.position >= botCommandRole.position);
            RoleManager.sendStaffText(client, member, `yasaklı tagı (${inlineCode(tag)}) ismine aldı`, staffRoles);
        }

        MemberManager.setRoles(member, client.config.SERVER.BANNED_TAG_ROLE);
        member.setNickname(null);

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        [
                            `${member} (${inlineCode(
                                member.id,
                            )}) kişisi sunucumuzda yasaklı olarak bulunan (${inlineCode(
                                tag,
                            )}) tagı ismine aldığı için yasaklı tag cezası aldı`,
                            codeBlock(
                                'fix',
                                [
                                    `${tag} yasaklı tagına sahip üye sayısı ${bannedTagMemberCount.size} oldu.`,
                                    `Sunucumuzda yasaklı taglardaki toplam kişi sayısı ${bannedTagsMemberCount.size} oldu.`,
                                ].join(),
                            ),
                        ].join('\n'),
                    ),
                ],
            });
        }

        return true;
    }

    if (
        oldHasTag &&
        !newHasTag &&
        ![
            client.config.SERVER.UNDERWORLD_ROLE,
            client.config.SERVER.QUARANTINE_ROLE,
            client.config.SERVER.SUSPECT_ROLE,
            client.config.SERVER.UNREGISTER_ROLE,
        ].some((r) => member.roles.cache.has(r))
    ) {
        MemberManager.setRoles(member, client.config.SERVER.UNREGISTER_ROLE);
        member.setNickname('İsim | Yaş');

        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        [
                            `${member} (${inlineCode(
                                member.id,
                            )})  kişisi sunucumuzda yasaklı olarak bulunan (${inlineCode(
                                tag,
                            )}) tagı isminden kaldırdığı için yasaklı tagdan çıkarıldı`,
                            codeBlock(
                                'fix',
                                [
                                    `${tag} yasaklı tagına sahip üye sayısı ${bannedTagMemberCount.size} oldu.`,
                                    `Sunucumuzda yasaklı taglardaki toplam kişi sayısı ${bannedTagsMemberCount.size} oldu.`,
                                ].join(),
                            ),
                        ].join('\n'),
                    ),
                ],
            });
        }

        return false;
    }

    return false;
}

export default bannedTagHandler;

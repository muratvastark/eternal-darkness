import { Client } from '@/base';
import { MemberManager } from '@/managers';
import { EmbedBuilder, GuildMember, TextChannel, codeBlock, inlineCode } from 'discord.js';

async function checkBannedTag(client: Client, member: GuildMember) {
    const tag = client.config.SERVER.BANNED_TAGS.find((t) =>
        member.user.displayName.toLowerCase().includes(t.toLowerCase()),
    );
    if (!tag) return false;

    await MemberManager.setRoles(member, client.config.SERVER.BANNED_TAG_ROLE);

    const channel = member.guild.channels.cache.find((c) => c.name === 'banned-tag-log') as TextChannel;
    if (!channel) return;

    const bannedTagsMemberCount = member.guild.members.cache.filter((m) =>
        m.roles.cache.has(client.config.SERVER.BANNED_TAG_ROLE),
    );
    const bannedTagMemberCount = member.guild.members.cache.filter((m) =>
        m.displayName.toLowerCase().includes(tag.toLowerCase()),
    );

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: [
                    `${member} (${inlineCode(member.id)}) kişisi sunucumuzda yasaklı olarak bulunan (${inlineCode(
                        tag,
                    )}) tagına sahip olduğu için yasaklı tag rolü verildi.`,
                    codeBlock(
                        'fix',
                        [
                            `${tag} yasaklı tagına sahip üye sayısı ${bannedTagMemberCount.size} oldu.`,
                            `Sunucumuzda yasaklı taglardaki toplam kişi sayısı ${bannedTagsMemberCount.size} oldu.`,
                        ].join(),
                    ),
                ].join('\n'),
                timestamp: Date.now(),
            }),
        ],
    });
    return true;
}

export default checkBannedTag;

import { Client } from '@/base';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
    EmbedBuilder,
    Guild,
    GuildMember,
    Role,
    TextChannel,
    bold,
    codeBlock,
    inlineCode,
} from 'discord.js';
import { MemberManager } from './MemberManager';
import { ANOTHER_TAGS } from '@/assets';

export class RoleManager {
    static unregistered(client: Client, guild: Guild) {
        guild.members.cache
            .filter((m) => m.roles.cache.size === 1 && m.manageable)
            .forEach((m) => m.roles.add(client.config.SERVER.UNREGISTER_ROLE));
    }

    static suspected(client: Client, guild: Guild) {
        const now = Date.now();
        guild.members.cache
            .filter(
                (m) =>
                    m.roles.cache.has(client.config.SERVER.SUSPECT_ROLE) &&
                    m.manageable &&
                    now - m.user.createdTimestamp >= 1000 * 60 * 60 * 24 * 7,
            )
            .forEach((m) => m.roles.remove(client.config.SERVER.SUSPECT_ROLE));
    }

    static tagged(client: Client, guild: Guild) {
        const channel = guild.channels.cache.find((c) => c.name === 'tag-log') as TextChannel;
        const now = Date.now();
        const tagMemberCount = guild.members.cache.filter((m) => m.user.displayName.includes(client.config.SERVER.TAG));
        guild.members.cache
            .filter(
                (m) =>
                    [
                        ...client.config.SERVER.WOMAN_ROLES,
                        ...client.config.SERVER.MAN_ROLES,
                        client.config.SERVER.REGISTERED_ROLE,
                    ].some((r) => m.roles.cache.has(r)) &&
                    !m.roles.cache.has(client.config.SERVER.FAMILY_ROLE) &&
                    m.manageable &&
                    m.user.displayName.includes(client.config.SERVER.TAG),
            )
            .forEach((m) => {
                m.roles.add(client.config.SERVER.FAMILY_ROLE);
                m.setNickname(m.displayName.replace(client.config.SERVER.UNTAGGED_TAG, client.config.SERVER.TAG));

                if (channel) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder({
                                color: client.utils.getRandomColor(),
                                timestamp: now,
                                description: [
                                    `${m} (${inlineCode(m.id)}) kullanıcısı tagımızı alarak aramıza katıldı!`,
                                    codeBlock('fix', `Mevcut isminde tag bulunan üye sayımız: ${tagMemberCount.size}`),
                                ].join('\n'),
                            }),
                        ],
                    });
                }
            });
    }

    static untagged(client: Client, guild: Guild) {
        const channel = guild.channels.cache.find((c) => c.name === 'tag-log') as TextChannel;
        const now = Date.now();
        const tagMemberCount = guild.members.cache.filter((m) => m.user.displayName.includes(client.config.SERVER.TAG));
        const botCommandRole = guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        guild.members.cache
            .filter(
                (m) =>
                    !m.user.displayName.includes(client.config.SERVER.TAG) &&
                    m.manageable &&
                    (m.roles.cache.has(client.config.SERVER.FAMILY_ROLE) ||
                        m.roles.highest.position >= botCommandRole.position),
            )
            .forEach(async (m) => {
                if (m.roles.highest.position >= botCommandRole.position) {
                    RoleManager.sendStaffText(client, m, 'tagı isminden çıkardı', m.roles.cache.filter((r) => botCommandRole.position <= r.position && !r.managed));
                    await m.roles.set(m.roles.cache.filter((r) => botCommandRole.position > r.position).map(r => r.id));
                }

                if (m.roles.cache.has(client.config.SERVER.FAMILY_ROLE)) await m.roles.remove(client.config.SERVER.FAMILY_ROLE);
                await m.setNickname(m.displayName.replace(client.config.SERVER.TAG, client.config.SERVER.UNTAGGED_TAG));

                if (channel) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder({
                                color: client.utils.getRandomColor(),
                                timestamp: now,
                                description: [
                                    `${m} (${inlineCode(m.id)}) kullanıcısı tagımızı bırakarak aramızdan ayrıldı!`,
                                    codeBlock('fix', `Mevcut isminde tag bulunan üye sayımız: ${tagMemberCount.size}`),
                                ].join('\n'),
                            }),
                        ],
                    });
                }
            });
    }

    static anotherTagged(client: Client, guild: Guild) {
        const filteredTags = ANOTHER_TAGS.filter((t) => t !== client.config.SERVER.TAG);
        const botCommandRole = guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        guild.members.cache
            .filter(
                (m) =>
                    m.roles.highest.position >= botCommandRole.position &&
                    m.manageable &&
                    filteredTags.some((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase())),
            )
            .forEach(async (m) => {
                const tag = filteredTags.find((t) => m.user.displayName.toLowerCase().includes(t.toLowerCase()));
                RoleManager.sendStaffText(client, m, `başka sunucunun tagını (${inlineCode(tag)}) ismine aldı`, m.roles.cache.filter((r) => botCommandRole.position <= r.position && !r.managed));
                await m.roles.set(m.roles.cache.filter((r) => botCommandRole.position > r.position));
            });
    }

    static bannedTagged(client: Client, guild: Guild) {
        const channel = guild.channels.cache.find((c) => c.name === 'banned-tag-log') as TextChannel;
        const botCommandRole = guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        const now = Date.now();
        guild.members.cache
            .filter(
                (m) =>
                    ![
                        client.config.SERVER.UNDERWORLD_ROLE,
                        client.config.SERVER.QUARANTINE_ROLE,
                        client.config.SERVER.SUSPECT_ROLE,
                        client.config.SERVER.UNREGISTER_ROLE,
                    ].some((role) => m.roles.cache.has(role)) &&
                    m.manageable &&
                    client.config.SERVER.BANNED_TAGS.some((t) =>
                        m.user.displayName.toLowerCase().includes(t.toLowerCase()),
                    ),
            )
            .forEach(async (m) => {
                const tag = client.config.SERVER.BANNED_TAGS.find((t) =>
                    m.user.displayName.toLowerCase().includes(t.toLowerCase()),
                );
                if (m.roles.highest.position >= botCommandRole.position) {
                    const staffRoles = m.roles.cache.filter((r) => r.position >= botCommandRole.position);
                    RoleManager.sendStaffText(client, m, `yasaklı tagı (${inlineCode(tag)}) ismine aldı`, staffRoles);
                }

                MemberManager.setRoles(m, client.config.SERVER.BANNED_TAG_ROLE);
                m.setNickname(null);
                if (m.voice.channelId) m.voice.disconnect();

                const bannedTagMemberCount = guild.members.cache.filter((m) =>
                    m.displayName.toLowerCase().includes(tag.toLowerCase()),
                );
                const bannedTagsMemberCount = guild.members.cache.filter((m) =>
                    m.roles.cache.has(client.config.SERVER.BANNED_TAG_ROLE),
                );

                if (channel) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder({
                                description: [
                                    `${m} (${inlineCode(m.id)}) kişisi sunucumuzda yasaklı olarak bulunan (${inlineCode(
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
                                color: client.utils.getRandomColor(),
                                timestamp: now,
                            }),
                        ],
                    });
                }
            });
    }

    static unBannedTagged(client: Client, guild: Guild) {
        const channel = guild.channels.cache.find((c) => c.name === 'banned-tag-log') as TextChannel;
        const now = Date.now();
        guild.members.cache
            .filter(
                (m) =>
                    m.roles.cache.has(client.config.SERVER.BANNED_TAG_ROLE) &&
                    m.manageable &&
                    !client.config.SERVER.BANNED_TAGS.some((t) =>
                        m.user.displayName.toLowerCase().includes(t.toLowerCase()),
                    ),
            )
            .forEach(async (m) => {
                MemberManager.setRoles(m, client.config.SERVER.UNREGISTER_ROLE);
                m.setNickname('İsim | Yaş');

                if (channel) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder({
                                color: client.utils.getRandomColor(),
                                timestamp: now,
                                description: `${m} (${inlineCode(
                                    m.id,
                                )})  kişisi sunucumuzda yasaklı olarak bulunan tagı isminden kaldırdığı için yasaklı tagdan çıkarıldı.`,
                            }),
                        ],
                    });
                }
            });
    }

    static async checkRoles(client: Client, guild: Guild) {
        await guild.members.fetch();
        RoleManager.suspected(client, guild);
        RoleManager.unregistered(client, guild);
        if (client.config.SERVER.TAGGED_SERVER) RoleManager.tagged(client, guild);
        if (client.config.SERVER.TAGGED_SERVER) RoleManager.untagged(client, guild);
        RoleManager.anotherTagged(client, guild);
        RoleManager.bannedTagged(client, guild);
        RoleManager.unBannedTagged(client, guild);
    }

    static async sendStaffText(client: Client, member: GuildMember, content: string, roles: Collection<string, Role>) {
        const channel = member.guild.channels.cache.find((c) => c.name === 'staff-tag-log') as TextChannel;
        if (!channel) return;

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'speak-user',
                    label: 'Konuş',
                    style: ButtonStyle.Success,
                }),
            ],
        });

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    timestamp: Date.now(),
                    description: [
                        `${member} (${inlineCode(member.id)}) adlı kullanıcı ${bold(content)} ve yetkileri çekildi!`,
                        codeBlock('yaml', `# Çekilen Rolleri\n${roles.map((r) => `→ ${r.name}`).join('\n')}`),
                    ].join('\n'),
                }),
            ],
            components: [row],
        });
    }
}

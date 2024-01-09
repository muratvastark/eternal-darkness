import { Client } from '@/base';
import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { IPenal } from '@/types';
import { EmbedBuilder, Guild, GuildMember, TextChannel, codeBlock, inlineCode } from 'discord.js';
import { MemberManager } from './MemberManager';

export class PenalManager {
    static checkBannedTag(client: Client, member: GuildMember) {
        const tag = client.config.SERVER.BANNED_TAGS.find((t) =>
            member.user.displayName.toLowerCase().includes(t.toLowerCase()),
        );
        if (tag) {
            const channel = member.guild.channels.cache.find((c) => c.name === 'banned-tag-log') as TextChannel;
            const now = Date.now();
            const bannedTagMemberCount = member.guild.members.cache.filter((m) =>
                m.displayName.toLowerCase().includes(tag.toLowerCase()),
            );
            const bannedTagsMemberCount = member.guild.members.cache.filter((m) =>
                m.roles.cache.has(client.config.SERVER.BANNED_TAG_ROLE),
            );

            if (channel) {
                channel.send({
                    embeds: [
                        new EmbedBuilder({
                            description: [
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
                            color: client.utils.getRandomColor(),
                            timestamp: now,
                        }),
                    ],
                });
            }
            MemberManager.setRoles(member, client.config.SERVER.BANNED_TAG_ROLE);
            return true;
        }

        return false;
    }

    static async unVoiceMute(client: Client, member: GuildMember) {
        if (member.roles.cache.has(client.config.SERVER.VOICE_MUTE_ROLE))
            await member.roles.remove(client.config.SERVER.VOICE_MUTE_ROLE);
        if (member.voice.channelId && member.voice.serverMute) await member.voice.setMute(false);

        const channel = member.guild.channels.cache.find((c) => c.name === 'mute-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(
                        member.id,
                    )}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı.`,
                }),
            ],
        });
    }

    static async unChatMute(client: Client, member: GuildMember) {
        if (member.roles.cache.has(client.config.SERVER.CHAT_MUTE_ROLE))
            await member.roles.remove(client.config.SERVER.CHAT_MUTE_ROLE);

        const channel = member.guild.channels.cache.find((c) => c.name === 'mute-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(
                        member.id,
                    )}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı.`,
                }),
            ],
        });
    }

    static async unUnderworld(client: Client, member: GuildMember, penal: IPenal) {
        const hasBannedTag = PenalManager.checkBannedTag(client, member);
        if (!hasBannedTag) {
            if (!penal.roles || !penal.roles.length)
                MemberManager.setRoles(member, client.config.SERVER.UNREGISTER_ROLE);
            else MemberManager.setRoles(member, penal.roles);
        }

        const channel = member.guild.channels.cache.find((c) => c.name === 'ban-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(
                        member.id,
                    )}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı. ${
                        hasBannedTag ? 'Fakat yasaklı tag bulundurduğu için yasaklı tag rolü verildi.' : ''
                    }`,
                }),
            ],
        });
    }

    static unQuarantine(client: Client, member: GuildMember, penal: IPenal) {
        const hasBannedTag = PenalManager.checkBannedTag(client, member);
        if (!hasBannedTag) {
            if (!penal.roles || !penal.roles.length)
                MemberManager.setRoles(member, client.config.SERVER.UNREGISTER_ROLE);
            else MemberManager.setRoles(member, penal.roles);
        }

        const channel = member.guild.channels.cache.find((c) => c.name === 'quarantine-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(
                        member.id,
                    )}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı. ${
                        hasBannedTag ? 'Fakat yasaklı tag bulundurduğu için yasaklı tag rolü verildi.' : ''
                    }`,
                }),
            ],
        });
    }

    static async checkPenals(client: Client, guild: Guild) {
        const now = Date.now();
        const penals = await PenalModel.find({
            finishTimestamp: { $lte: now },
            $nor: [{ type: PenalFlags.ForceBan }],
            activity: true,
            visible: true,
        });
        for (const penal of penals) {
            penal.activity = false;
            penal.save();

            const member = await MemberManager.getMember(guild, penal.user);
            if (!member) continue;

            if (penal.type === PenalFlags.VoiceMute) PenalManager.unVoiceMute(client, member);
            if (penal.type === PenalFlags.ChatMute) PenalManager.unChatMute(client, member);
            if (penal.type === PenalFlags.Quarantine) PenalManager.unQuarantine(client, member, penal);
            if (penal.type === PenalFlags.Underworld) PenalManager.unUnderworld(client, member, penal);
        }
    }
}

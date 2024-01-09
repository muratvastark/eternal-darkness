import { Client } from '@/base';
import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { IPenal } from '@/types';
import { EmbedBuilder, Guild, GuildMember, TextChannel, codeBlock, inlineCode } from 'discord.js';
import { MemberManager } from './MemberManager';
import { Document } from 'mongoose';

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

    static async unVoiceMute(client: Client, member: GuildMember, penal: Document<unknown, any, IPenal> & IPenal) {
        if (member.voice.channelId && member.voice.channel.parentId === '1106946127305130116') return;

        penal.activity = false;

        let completed = true;
        if (member.voice.channelId) await member.voice.setMute(false);
        else completed = false;
        penal.completed = completed;

        penal.save();

        const channel = member.guild.channels.cache.find((c) => c.name === 'mute-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: penal.completed
                        ? `${member} (${inlineCode(member.id)}) adlı kullanıcının ceza süresi dolduğu için kaldırıldı.`
                        : `${member} (${inlineCode(
                              member.id,
                          )}) adlı kullanıcının cezası kaldırılamadı sese girdiğinde kaldırılacak.`,
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

    static async unAds(client: Client, member: GuildMember, penal: IPenal) {
        const hasBannedTag = PenalManager.checkBannedTag(client, member);
        if (!hasBannedTag) {
            if (!penal.roles || !penal.roles.length)
                MemberManager.setRoles(member, client.config.SERVER.UNREGISTER_ROLE);
            else MemberManager.setRoles(member, penal.roles);
        }

        const channel = member.guild.channels.cache.find((c) => c.name === 'ads-log') as TextChannel;
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

    static async unAnotherPunishment(client: Client, member: GuildMember, roleId: string, channelId: string) {
        if (member.roles.cache.has(roleId)) await member.roles.remove(roleId);

        const channel = member.guild.channels.cache.get(channelId) as TextChannel;
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

    static async checkPenals(client: Client, guild: Guild) {
        const now = Date.now();
        const penals = await PenalModel.find({
            finishTimestamp: { $lte: now },
            $nor: [{ type: PenalFlags.ForceBan }],
            activity: true,
            visible: true,
        });
        for (const penal of penals) {
            const member = await MemberManager.getMember(guild, penal.user);
            if (!member) continue;

            if (penal.type === PenalFlags.VoiceMute) {
                PenalManager.unVoiceMute(client, member, penal);
                continue;
            }

            if (penal.type === PenalFlags.ChatMute) PenalManager.unChatMute(client, member);
            if (penal.type === PenalFlags.Quarantine) PenalManager.unQuarantine(client, member, penal);
            if (penal.type === PenalFlags.Ads) PenalManager.unAds(client, member, penal);
            if (penal.type === PenalFlags.Underworld) PenalManager.unUnderworld(client, member, penal);

            if (
                ![
                    PenalFlags.Ads,
                    PenalFlags.Underworld,
                    PenalFlags.VoiceMute,
                    PenalFlags.ChatMute,
                    PenalFlags.Quarantine,
                ].includes(penal.type)
            ) {
                const punishment = client.config.SERVER.PUNISMENT_COMMANDS.find((c) => c.TYPE === penal.type);
                if (!punishment) continue;

                PenalManager.unAnotherPunishment(client, member, punishment.ROLE, punishment.CHANNEL);
            }

            penal.activity = false;
            penal.save();
        }
    }
}

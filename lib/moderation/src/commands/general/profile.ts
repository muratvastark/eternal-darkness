import { MemberManager } from '@/managers';
import { ICommand } from '@/types';
import { EmbedBuilder, inlineCode, time, userMention } from 'discord.js';

const Profile: ICommand = {
    usages: ['profil', 'i', 'profil'],
    description: 'Belirttiğiniz kişinin profil bilgilerini görürsünüz.',
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : await message.author.fetch());
        const member = await MemberManager.getMember(message.guild, user.id);

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            thumbnail: { url: user.displayAvatarURL({ forceStatic: true }) },
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
            fields: [
                {
                    name: '❯ Kullanıcı Bilgisi',
                    value: [
                        ,
                        `${inlineCode('•')} Hesap: ${user}`,
                        `${inlineCode('•')} Kullanıcı ID: ${user.id}`,
                        `${inlineCode('•')} Kuruluş Tarihi: ${time(Math.floor(user.createdTimestamp / 1000))} (${time(
                            Math.floor(user.createdTimestamp / 1000),
                            'R',
                        )})`,
                    ].join('\n'),
                    inline: false,
                },
            ],
        });

        if (!member) {
            message.channel.send({ embeds: [embed] });
            return;
        }

        const guildMembers = [...message.guild.members.cache.filter((x) => !x.user.bot).values()].sort(
            (a, b) => a.joinedTimestamp - b.joinedTimestamp,
        );
        const joinPos = guildMembers.map((u) => u.id).indexOf(member.id);
        const previous = guildMembers[joinPos - 1] ? guildMembers[joinPos - 1].user : null;
        const next = guildMembers[joinPos + 1] ? guildMembers[joinPos + 1].user : null;
        const memberRoles = member.roles.cache
            .filter((role) => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map((role) => role.toString());

        embed.addFields([
            {
                name: '❯ Sunucu Bilgisi',
                value: [
                    `${inlineCode('•')} Sunucu İsmi: ${
                        member.displayName == user.username ? `${user.username} [Yok]` : member.displayName
                    }`,
                    `${inlineCode('•')} Katılım Tarihi: ${time(Math.floor(member.joinedTimestamp / 1000))} (${time(
                        Math.floor(member.joinedTimestamp / 1000),
                        'R',
                    )}) `,
                    `${inlineCode('•')} Katılım Sırası: ${joinPos + 1}`,
                    `${inlineCode('•')} Katılım Bilgisi: ${previous ? `**${previous.username}** > ` : ''}${userMention(
                        user.id,
                    )}${next ? ` > **${next.username}**` : ''}`,
                    `${inlineCode('•')} Rolleri(${memberRoles.length}): ${
                        memberRoles.length
                            ? memberRoles.length > 6
                                ? `${memberRoles.slice(0, 6).join(', ')} ${memberRoles.slice(0, 6).length} daha...`
                                : memberRoles.join(', ')
                            : 'Rolü bulunmuyor.'
                    }`,
                ].join('\n'),
                inline: false,
            },
        ]);

        message.channel.send({
            embeds: [
                embed.setImage(
                    user.banner
                        ? user.bannerURL({
                              size: 4096,
                              forceStatic: true,
                              extension: user.banner.startsWith('a_') ? 'gif' : 'png',
                          })
                        : undefined,
                ),
            ],
        });
    },
};

export default Profile;

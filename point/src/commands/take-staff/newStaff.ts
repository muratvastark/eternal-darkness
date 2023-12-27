import { StaffModel } from '@/models';
import { StaffManager } from '@/managers';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Colors,
    ComponentType,
    EmbedBuilder,
    GuildMember,
    Message,
    TextChannel,
    inlineCode,
    roleMention,
    formatEmoji,
    bold,
    time,
    PermissionFlagsBits,
} from 'discord.js';
import { Client } from '@/base';

export default async function newStaff(client: Client, message: Message, member: GuildMember) {
    const memberDocument = (await StaffModel.findOne({ id: member.id })) || { oldRoles: [] };

    if (
        memberDocument.oldRoles.filter((o) => o.isDown).length &&
        !message.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
        client.utils.sendTimedMessage(
            message,
            'Belirttiğin kullanıcı önceden yetki olup yetkiden atılmış. Yetkiye alamazsın yöneticilere ulaşması gerekiyor.',
        );
        return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder({
                custom_id: 'accept',
                label: 'Kabul Ediyorum',
                style: ButtonStyle.Secondary,
                emoji: { id: '1163930055576133702' },
            }),
            new ButtonBuilder({
                custom_id: 'deaccept',
                label: 'Reddediyorum',
                style: ButtonStyle.Secondary,
                emoji: { id: '1163930063910211746' },
            }),
        ],
    });
    const question = await message.channel.send({
        content: `${member} selam ${message.author} adlı yetkilimiz seni yetkiye davet etti!`,
        components: [row],
        embeds: memberDocument.oldRoles.length
            ? [
                  new EmbedBuilder({
                      color: client.utils.getRandomColor(),
                      description: [
                          `${formatEmoji('1165040103874383914')} ${member} şuan da sana yetki verilmek üzere\n`,
                          `${formatEmoji('1165040103874383914')} ${bold('GEÇMİŞ YETKİ DURUMU')}`,
                          memberDocument.oldRoles
                              .map(
                                  (r) =>
                                      `${time(Math.floor(r.timestamp / 1000), 'R')} ${
                                          r.roles.length
                                              ? r.roles.map((rr) => roleMention(rr)).join(', ')
                                              : 'Yetkiden atılma!'
                                      }`,
                              )
                              .join('\n'),
                      ].join('\n'),
                  }),
              ]
            : [],
    });

    const filter = (i: ButtonInteraction) => i.user.id === member.id && ['accept', 'deaccept'].includes(i.customId);
    const collector = question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 5,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i: ButtonInteraction) => {
        i.deferUpdate();

        if (i.customId === 'deaccept') {
            question.edit({
                content: `${member} adlı kullanıcı ${message.author} adlı yetkilinin yetkiye alma isteğini red etti.`,
                components: [],
            });
            return;
        }

        question.edit({
            content: `Başarılı bir şekilde ${member} adlı üye yetkili olarak seçildi.`,
            components: [
                new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'accept',
                            label: 'İstek Kabul Edildi!',
                            disabled: true,
                            style: ButtonStyle.Secondary,
                            emoji: { id: '1163930055576133702' }, 
                        }),
                    ],
                }),
            ],
        });

        const now = Date.now();

        const document = await StaffModel.findOneAndUpdate(
            { id: message.author.id },
            {
                $inc: {
                    totalPoints: client.config.SERVER.STAFF_TAKE_POINT,
                    allPoints: client.config.SERVER.STAFF_TAKE_POINT,
                },
                $push: { staffTakes: { id: member.id, timestamp: now } },
            },
            { upsert: true },
        );

        await StaffManager.checkTasks({
            document,
            spesificType: 'STAFF',
            count: 1,
        });
        await StaffManager.checkRole(message.member, document);
        document.save();

        const sortedRanks = client.config.SERVER.RANKS.sort((a, b) => a.POINT - b.POINT);
        await member.roles.add([sortedRanks[0].EXTRA_ROLE, sortedRanks[0].ID]);

        await StaffModel.updateOne(
            { id: member.id },
            {
                $push: {
                    oldRoles: { timestamp: now, roles: [sortedRanks[0].ID, sortedRanks[0].EXTRA_ROLE] },
                },
            },
            { upsert: true },
        );

        const takeLogChannel = message.guild.channels.cache.find((c) => c.name === 'take-staff-log') as TextChannel;
        if (takeLogChannel) {
            takeLogChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: Colors.Green,
                        description: `${message.author} (${inlineCode(
                            message.author.id,
                        )}) adlı yetkili ${member} (${inlineCode(member.id)}) adlı kullanıcıyı ${roleMention(
                            sortedRanks[0].ID,
                        )} yetkisinden yetkiye başlattı.`,
                    }),
                ],
            });
        }

        const orientationLogChannel = message.guild.channels.cache.find((c) => c.name === 'oryantasyon-verilecek') as TextChannel;
        if (orientationLogChannel) {
            orientationLogChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: Colors.Green,
                        description: `${member} (${inlineCode(member.id)}) adlı kullanıcı ${roleMention(sortedRanks[0].ID)} yetkisinden yetkiye başladı.`,
                    }),
                ],
            });
        }
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
    });
}

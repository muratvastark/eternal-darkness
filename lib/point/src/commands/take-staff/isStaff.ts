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
    time,
    bold,
    formatEmoji,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from 'discord.js';
import { Client } from '@/base';

export default async function isStaff(client: Client, message: Message, member: GuildMember) {
    if (member.roles.highest.position >= message.member.roles.highest.position) {
        client.utils.sendTimedMessage(message, 'Sahip olduğun yetkinin altındaki rollerde işlem yapabilirsin.');
        return;
    }

    const memberDocument = (await StaffModel.findOne({ id: member.id })) || { oldRoles: [] };
    const { currentRole, currentIndex } = StaffManager.getRank(member.roles.cache.map((r) => r.id));
    const row = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new StringSelectMenuBuilder({
                custom_id: 'role-selection',
                placeholder: 'Tıkla ve listele',
                options: client.config.SERVER.RANKS.map((r) => ({
                    value: r.ID,
                    label: message.guild.roles.cache.get(r.ID).name,
                })),
            }),
        ],
    });

    const question = await message.channel.send({
        content: `${member} adlı yetkiliye yapacağınız işlemi seçin!`,
        components: [row],
        embeds: memberDocument.oldRoles.length
            ? [
                  new EmbedBuilder({
                      color: client.utils.getRandomColor(),
                      description: [
                          `${member} şuan da sana yetki verilmek üzere\n`,
                          `${bold('GEÇMİŞ YETKİ DURUMU')}`,
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

    const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id && question.id === i.message.id;
    const collector = question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 5,
        componentType: ComponentType.StringSelect,
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
        const newRole = client.config.SERVER.RANKS.find((r) => r.ID === i.values[0]);

        if (currentRole.ID === newRole.ID) {
            i.reply({
                content: 'Belirttiğin rolde bulunuyor.',
                ephemeral: true,
            });
            return;
        }

        i.deferUpdate();

        question.edit({
            content: `${member} adlı kullanıcının yetkisi ${roleMention(currentRole.ID)} rolünden ${roleMention(
                newRole.ID,
            )} rolüne geçirildi.`,
            components: [],
        });

        const now = Date.now();
        await StaffModel.updateOne(
            { id: member.id },
            {
                $push: {
                    oldRoles: {
                        timestamp: now,
                        roles: [i.values[0], newRole.EXTRA_ROLE],
                    },
                },
                $set: {
                    bonusPoints: 0,
                    invitedUsers: [],
                    tasks: [],
                    messagePoints: 0,
                    otherPoints: 0,
                    registerPoints: 0,
                    publicPoints: 0,
                    responsibilityPoints: 0,
                    roleStarted: Date.now(),
                    staffTakes: [],
                    totalPoints: 0,
                },
            },
            { upsert: true },
        );

        await member.roles.add(newRole.ID);
        await member.roles.remove(currentRole.ID);
        if (currentRole.EXTRA_ROLE === newRole.EXTRA_ROLE) {
            await member.roles.remove(currentRole.EXTRA_ROLE);
            await member.roles.add(newRole.EXTRA_ROLE);
        }

        const logChannel = message.guild.channels.cache.find((c) => c.name === 'take-staff-log') as TextChannel;
        if (logChannel) {
            logChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: Colors.Yellow,
                        description: `${message.author} (${inlineCode(
                            message.author.id,
                        )}) adlı yetkili ${member} (${inlineCode(member.id)}) adlı yetkiliyi ${roleMention(
                            currentRole.ID,
                        )} yetkisini ${roleMention(i.values[0])} yetkisine geçirdi.`,
                    }),
                ],
            });
        }
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
    });
}

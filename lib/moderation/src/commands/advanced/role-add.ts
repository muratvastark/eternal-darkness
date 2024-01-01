import { PenalFlags, RoleLogFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { PenalModel, UserModel } from '@/models';
import { ICommand } from '@/types';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    PermissionFlagsBits,
    RoleSelectMenuBuilder,
    RoleSelectMenuInteraction,
    TextChannel,
    bold,
    inlineCode,
    time,
} from 'discord.js';

const RoleAdd: ICommand = {
    usages: ['re', 'rolekle', 'r', 'rolver', 'rol-ver', 'rver', 'rol-ekle', 'r-ver'],
    description: 'Belirttiğiniz kullanıcıya menüden seçtiğiniz rolleri ekler/kaldırır.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713'],
    execute: async ({ client, message, args }) => {
        const member =
            (await MemberManager.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt.');
            return;
        }
        if (member.permissions.has(PermissionFlagsBits.ManageRoles) && message.member.id !== member.id) {
            client.utils.sendTimedMessage(
                message,
                `Belirttiğin üyenin ${inlineCode('ROL_YÖNET')} izni olduğu için ona işlem yapamazsın.`,
            );
            return;
        }

        const hasPenal = await PenalModel.exists({
            user: member.id,
            activity: true,
            $or: [{ type: PenalFlags.Underworld }, { type: PenalFlags.Quarantine }],
        });
        if (hasPenal) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası bulunuyor işlem yapamazsın.');
            return;
        }

        const maxRole = await message.guild.roles.cache.get(client.config.SERVER.ROLE_ADD_MAX_ROLE);
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const row = new ActionRowBuilder<RoleSelectMenuBuilder>({
            components: [
                new RoleSelectMenuBuilder({
                    custom_id: 'menu',
                    max_values: 25,
                    min_values: 1,
                    placeholder: 'Rol ara..',
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: [
                        `Aşağıdaki menüden ${member} (${inlineCode(
                            member.id,
                        )}) adlı kullanıcıya yapacağınız işlemi seçin.`,
                        `${bold(
                            'NOT:',
                        )} Eğer belirttiğiniz rol kullanıcıda varsa rolü çeker. ${maxRole} rolünün altındaki rolleri verebilirsiniz veya alabilirsiniz.`,
                    ].join('\n'),
                }),
            ],
            components: [row],
        });

        const filter = (i: RoleSelectMenuInteraction) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            componentType: ComponentType.RoleSelect,
        });

        collector.on('collect', async (i: RoleSelectMenuInteraction) => {
            i.deferUpdate();

            const punishmentRoles = [
                client.config.SERVER.PENALS.CHAT_MUTE.ROLE,
                client.config.SERVER.PENALS.VOICE_MUTE.ROLE,
                client.config.SERVER.PENALS.QUARANTINE.ROLE,
                client.config.SERVER.PENALS.UNDERWORLD.ROLE,
            ];

            const roles = i.values
                .filter((roleId) => !punishmentRoles.includes(roleId))
                .map((roleId) => message.guild.roles.cache.get(roleId));
            const added: string[] = [];
            const removed: string[] = [];
            const now = Date.now();
            const hasPenalRole = i.values.some((roleId) => punishmentRoles.includes(roleId));

            for (const role of roles) {
                if (
                    !message.member.roles.cache.has(client.config.SERVER.OWNER_ROLE) &&
                    role.position >= maxRole.position
                )
                    return;

                if (member.roles.cache.has(role.id)) {
                    removed.push(role.toString());
                    member.roles.remove(role);
                } else {
                    added.push(role.toString());
                    member.roles.add(role);
                }

                await UserModel.updateOne(
                    { id: member.id },
                    {
                        $push: {
                            roleLogs: {
                                type: member.roles.cache.has(role.id) ? RoleLogFlags.Remove : RoleLogFlags.Add,
                                roles: [role.id],
                                time: now,
                                admin: message.author.id,
                            },
                        },
                    },
                    { upsert: true },
                );
            }

            const channel = message.guild.channels.cache.find((c) => c.name === 'role-log') as TextChannel;
            if (channel) {
                if (added.length) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Green')
                                .setTitle(`${added.length > 1 ? 'Roller' : 'Rol'} Eklendi!`)
                                .setFields([
                                    { name: 'Kullanıcı', value: `${member} (${inlineCode(member.id)})`, inline: true },
                                    {
                                        name: 'Yetkili',
                                        value: `${message.author} (${inlineCode(message.author.id)})`,
                                        inline: true,
                                    },
                                    { name: 'Tarih', value: time(Math.floor(Date.now() / 1000), 'R'), inline: true },
                                    {
                                        name: `İşlem Yapılan ${added.length > 1 ? 'Roller' : 'Rol'}`,
                                        value: added.join(', '),
                                        inline: false,
                                    },
                                ]),
                        ],
                    });
                }
                if (removed.length) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setTitle(`${removed.length > 1 ? 'Roller' : 'Rol'} Çıkarıldı!`)
                                .setFields([
                                    { name: 'Kullanıcı', value: `${member} (${inlineCode(member.id)})`, inline: true },
                                    {
                                        name: 'Yetkili',
                                        value: `${message.author} (${inlineCode(message.author.id)})`,
                                        inline: true,
                                    },
                                    { name: 'Tarih', value: time(Math.floor(Date.now() / 1000), 'R'), inline: true },
                                    {
                                        name: `İşlem Yapılan ${removed.length > 1 ? 'Roller' : 'Rol'}`,
                                        value: removed.join(', '),
                                        inline: false,
                                    },
                                ]),
                        ],
                    });
                }
            }

            let content = `${member} adlı `;
            if (added.length && removed.length) {
                content += [
                    `kullanıcıya ${added.map((r) => bold(r)).join(', ')} ${
                        added.length > 1 ? 'rolleri' : 'rolü'
                    } eklendi`,
                    `ve ${removed.map((r) => bold(r)).join(', ')} ${
                        removed.length > 1 ? 'rolleri' : 'rolü'
                    } çıkarıldı.`,
                ].join(' ');
            } else if (added.length) {
                content += `kullanıcıya ${added.map((r) => bold(r)).join(', ')} ${
                    added.length > 1 ? 'rolleri' : 'rolü'
                } eklendi.`;
            } else if (removed.length) {
                content += `kullanıcıdan ${removed.map((r) => bold(r)).join(', ')} ${
                    removed.length > 1 ? 'adlı roller' : 'rolü'
                } çıkarıldı.`;
            } else if (!added.length && !removed.length) {
                content = 'Geçersiz rol girmişsin.';
            }

            question.edit({
                embeds: [
                    embed
                        .setColor('Random')
                        .setDescription(
                            [
                                content,
                                hasPenalRole
                                    ? `Ceza rollerini vermek/almak için ceza komutlarını kullanabilirsin.`
                                    : undefined,
                            ]
                                .filter(Boolean)
                                .join(' '),
                        )
                        .setFields([])
                        .setTitle(null),
                ],
                components: [],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default RoleAdd;

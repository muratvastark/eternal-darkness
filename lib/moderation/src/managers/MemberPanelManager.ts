import {
    ActionRowBuilder,
    ButtonInteraction,
    EmbedBuilder,
    GuildMember,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    bold,
    inlineCode,
    time,
} from 'discord.js';
import { MemberManager } from './MemberManager';
import { LimitFlags, NameFlags, PenalFlags } from '@/enums';
import { PenalModel, UserModel } from '@/models';
import { Client } from '@/base';
import config from '../../config.json';

const registerTitles = {
    [NameFlags.Man]: 'Kayıt Olma (Erkek)',
    [NameFlags.Woman]: 'Kayıt Olma (Kız)',
    [NameFlags.ChangeName]: 'İsim Değiştirme (Yetkili)',
    [NameFlags.Booster]: 'İsim Değiştirme (Boost)',
    [NameFlags.AutoRegister]: 'Oto Kayıt',
};

const penalTitles = {
    [PenalFlags.Underworld]: 'Sunucudan Yasaklanma',
    [PenalFlags.ChatMute]: 'Sohbet Mutesi',
    [PenalFlags.VoiceMute]: 'Ses Mutesi',
    [PenalFlags.Quarantine]: 'Cezalı',
    [PenalFlags.ForceBan]: 'Kalıcı Ban',
};

const penalPoints = {
    [PenalFlags.Underworld]: config.SERVER.PENALS.UNDERWORLD.POINT,
    [PenalFlags.ChatMute]: config.SERVER.PENALS.CHAT_MUTE.POINT,
    [PenalFlags.VoiceMute]: config.SERVER.PENALS.VOICE_MUTE.POINT,
    [PenalFlags.Quarantine]: config.SERVER.PENALS.QUARANTINE.POINT,
    [PenalFlags.ForceBan]: 1000,
};

const inviteRegex =
    /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;
const adsRegex = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç\s])+/gi;

export class MemberPanelManager {
    static checkLimit(interaction: ButtonInteraction) {
        const limit = MemberManager.checkLimit(interaction.user.id, LimitFlags.MemberPanel, 3, 1000 * 60 * 60);
        if (limit.hasLimit) {
            interaction.reply({
                content: `Butonlarla çok fazla işlem yaptığın için sınırlandırıldın daha sonra tekrar dene.`,
                ephemeral: true,
            });
            return true;
        }

        return false;
    }

    static async historyNames(client: Client, interactionMember: GuildMember, interaction: ButtonInteraction) {
        const document = await UserModel.findOne({ id: interactionMember.id, guild: interaction.guild.id });
        if (!document || !document.names.length) {
            interaction.reply({ content: 'Hiç isim veriniz bulunmuyor', ephemeral: true });
            return;
        }

        interaction.reply({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: interactionMember.user.username,
                        icon_url: interactionMember.displayAvatarURL({ forceStatic: true }),
                    },
                    description: [
                        `Toplam da ${document.names.length} isim kayıtınız bulundu:`,
                        `${document.names
                            .slice(
                                document.names.length ? document.names.length - 10 : 0,
                                document.names.length ? document.names.length : 10,
                            )
                            .map(
                                (n) =>
                                    `${inlineCode(`•`)} ${time(Math.floor(n.timestamp / 1000), 'D')}: ${
                                        n.name ? n.name : undefined
                                    } ${bold(`(${registerTitles[n.type]})`)}`,
                            )
                            .join('\n')}`,
                    ].join('\n'),
                }),
            ],
            ephemeral: true,
        });
    }

    static memberRoles(client: Client, interactionMember: GuildMember, interaction: ButtonInteraction) {
        const memberRoles = interactionMember.roles.cache
            .filter((role) => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map((role) => role.toString());

        interaction.reply({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: interactionMember.user.username,
                        icon_url: interactionMember.displayAvatarURL({ forceStatic: true }),
                    },
                    description: `${inlineCode('•')} Rolleri(${memberRoles.length}): ${
                        memberRoles.length
                            ? memberRoles.length > 6
                                ? `${memberRoles.slice(0, 6).join(', ')} ${memberRoles.slice(0, 6).length} daha...`
                                : memberRoles.join(', ')
                            : 'Rolü bulunmuyor.'
                    }`,
                }),
            ],
            ephemeral: true,
        });
    }

    static async activePenals(client: Client, interactionMember: GuildMember, interaction: ButtonInteraction) {
        const activePenals = await PenalModel.find({ user: interactionMember.id, activity: true, visible: true });
        if (!activePenals.length) {
            interaction.reply({ content: 'Hiç ceza veriniz bulunmuyor', ephemeral: true });
            return;
        }

        interaction.reply({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: interactionMember.user.username,
                        icon_url: interactionMember.displayAvatarURL({ forceStatic: true }),
                    },
                    description: activePenals
                        .map((r) => `${penalTitles[r.type]} (${time(Math.floor(r.finishTimestamp / 1000))})`)
                        .join('\n'),
                }),
            ],
            ephemeral: true,
        });
    }

    static async historyPenals(client: Client, interactionMember: GuildMember, interaction: ButtonInteraction) {
        const penals = await PenalModel.find({ user: interactionMember.id, visible: true });
        if (!penals.length) {
            interaction.reply({ content: 'Ceza veriniz yok!', ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });

        await interaction.reply({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: interactionMember.user.username,
                        icon_url: interactionMember.displayAvatarURL({ forceStatic: true }),
                    },
                    fields: [
                        {
                            name: 'Ses Susturması',
                            value: penals.filter((p) => p.type === PenalFlags.VoiceMute).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Yazı Susturması',
                            value: penals.filter((p) => p.type === PenalFlags.ChatMute).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Diğer Cezalar',
                            value: penals
                                .filter(
                                    (p) =>
                                        ![
                                            PenalFlags.VoiceMute,
                                            PenalFlags.Quarantine,
                                            PenalFlags.Underworld,
                                            PenalFlags.ChatMute,
                                        ].includes(p.type),
                                )
                                .length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Cezalı',
                            value: penals.filter((p) => p.type === PenalFlags.Quarantine).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Yasaklama',
                            value: penals.filter((p) => p.type === PenalFlags.Underworld).length.toString(),
                            inline: true,
                        },
                        {
                            name: 'Karantina/Reklam',
                            value: penals.filter((p) => p.type === PenalFlags.Quarantine).length.toString(),
                            inline: true,
                        },
                    ],
                }),
            ],
            ephemeral: true,
        });
    }

    static async punishPoints(client: Client, interactionMember: GuildMember, interaction: ButtonInteraction) {
        const penals = await PenalModel.find().select('type');
        interaction.reply({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: interactionMember.user.username,
                        icon_url: interactionMember.displayAvatarURL({ forceStatic: true }),
                    },
                    description: `${penals.reduce((a, b) => a + penalPoints[b.type], 0)} cezan bulunuyor.`,
                }),
            ],
            ephemeral: true,
        });
    }

    static async booster(client: Client, interactionMember: GuildMember, interaction: ButtonInteraction) {
        const nameRow = new ActionRowBuilder<TextInputBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: 'name',
                    label: 'İsim:',
                    max_length: 30,
                    style: TextInputStyle.Short,
                    placeholder: 'Muratva Stark',
                    required: true,
                }),
            ],
        });

        const modal = new ModalBuilder({ custom_id: 'modal', components: [nameRow], title: 'Booster İsim Değiştirme' });

        await interaction.showModal(modal);

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        if (modalCollected) {
            const name = modalCollected.fields.getTextInputValue('name');

            if (name.match(adsRegex)) {
                modalCollected.reply({
                    content: 'Belirttiğin kullanıcı adında özel harflerin bulunmaması gerekiyor!',
                    ephemeral: true,
                });
                return;
            }

            if (inviteRegex.test(name)) {
                interaction.reply({
                    content: 'Reklam yapmasak mı?',
                    ephemeral: true,
                });
                return;
            }

            const limit = MemberManager.checkLimit(interaction.user.id, LimitFlags.Boost);
            if (limit.hasLimit) {
                modalCollected.reply({
                    content: `Atabileceğiniz maksimum kayıtsız limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
                    ephemeral: true,
                });
                return;
            }

            let newName = name;
            if (client.config.SERVER.TAGGED_SERVER) {
                const hasTag = interaction.user.displayName.includes(client.config.SERVER.TAG);
                newName = `${hasTag ? client.config.SERVER.TAG : client.config.SERVER.UNTAGGED_TAG} ${name}`;
            }

            if (newName.length > 30) {
                modalCollected.reply({
                    content: '30 karakteri geçmeyecek bir isim belirt.',
                    ephemeral: true,
                });
                return;
            }

            const member = await MemberManager.getMember(interaction.guild, interaction.user.id);

            if (!member.manageable) {
                modalCollected.reply({
                    content: 'Yetkim yetmediği için kullanıcı adını değiştiremiyorum!',
                    ephemeral: true,
                });
                return;
            }

            member.setNickname(newName);

            modalCollected.reply({
                content: `İsmin "${bold(newName)}" olarak değiştirildi.`,
                ephemeral: true,
            });
        }
    }
}

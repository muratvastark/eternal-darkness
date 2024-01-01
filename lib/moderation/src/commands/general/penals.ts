import { PenalFlags } from '@/enums';
import { MemberManager, PenalManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import {
    APIEmbedField,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    Interaction,
    StringSelectMenuBuilder,
    inlineCode,
    time,
    userMention,
} from 'discord.js';

const types = {
    [PenalFlags.Underworld]: 'Sunucudan Yasaklanma',
    [PenalFlags.ChatMute]: 'Sohbet Mutesi',
    [PenalFlags.VoiceMute]: 'Ses Mutesi',
    [PenalFlags.Quarantine]: 'Cezalı',
    [PenalFlags.ForceBan]: 'Kalıcı Ban',
};

const Penals: ICommand = {
    usages: ['penals', 'cezalar', 'sicil'],
    description: 'Kullanıcının cezalarını gösterir.',
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirtmelisin!');

        const penals = await PenalModel.find({ user: user.id, visible: true });
        if (!penals.length) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcının ceza verisi yok!');

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'penals',
                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                    options: penals.slice(0, 25).map((penal) => {
                        return {
                            label: `${types[penal.type]} (#${penal.id})`,
                            description: 'Daha fazla bilgi için tıkla!',
                            value: penal.id.toString(),
                        };
                    }),
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });

        let components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [row];
        const totalData = Math.ceil(penals.length / 25);
        let page = 1;
        if (penals.length > 25) components.push(client.utils.paginationButtons(page, totalData));

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(`${user} (${inlineCode(user.id)}) adlı kullanıcının cezaları.`).setFields([
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
                ]),
            ],
            components: components,
        });

        const filter = (i: Interaction) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
        });

        collector.on('collect', (i: Interaction) => {
            if (i.isStringSelectMenu()) {
                const penal = penals.find((p) => p.id.toString() === i.values[0]);
                const image = PenalManager.getImage(penal.reason || '');

                const fields: APIEmbedField[] = [];
                fields.push({
                    name: `Ceza Detayı (${types[penal.type]})`,
                    value: [
                        `${inlineCode('>')} Üye Bilgisi: ${userMention(penal.user)} (${inlineCode(penal.user)})`,
                        `${inlineCode('>')} Yetkili Bilgisi: ${userMention(penal.admin)} (${inlineCode(penal.admin)})`,
                        `${inlineCode('>')} Ceza Tarihi: ${time(
                            Math.floor(penal.createdTimestamp.valueOf() / 1000),
                            'D',
                        )}`,
                        `${inlineCode('>')} Ceza Süresi: ${
                            penal.finishTimestamp
                                ? client.utils.numberToString(penal.finishTimestamp - penal.createdTimestamp)
                                : 'Süresiz.'
                        }`,
                        `${inlineCode('>')} Ceza Durumu: ${inlineCode(penal.activity ? 'Aktif ✔' : 'Aktif Değil ❌')}`,
                    ].join('\n'),
                    inline: false,
                });

                if (penal.remover && penal.removeTimestamp) {
                    fields.push({
                        name: 'Ceza Kaldırılma Detayı',
                        value: [
                            `${inlineCode('>')} Kaldıran Yetkili: (${userMention(penal.remover)} ${inlineCode(
                                penal.remover,
                            )})`,
                            `${inlineCode('>')} Kaldırma Tarihi: ${time(
                                Math.floor(penal.removeTimestamp.valueOf() / 1000),
                                'D',
                            )}`,
                            `${inlineCode('>')} Kaldırılma Sebebi: ${inlineCode(
                                penal.removeReason || 'Sebep belirtilmemiş.',
                            )}`,
                        ].join('\n'),
                        inline: false,
                    });
                }

                const replacedReason = (penal.reason || '').replace(PenalManager.reasonImage, '');
                if (replacedReason.length) {
                    fields.push({
                        name: 'Ceza Sebebi',
                        value: inlineCode(replacedReason || 'Sebep belirtilmemiş.'),
                        inline: false,
                    });
                }

                i.reply({
                    embeds: [
                        embed
                            .setFields(fields)
                            .setDescription(null)
                            .setImage(image ? image : undefined),
                    ],
                    ephemeral: true,
                });
                return;
            }

            if (i.isButton()) {
                i.deferUpdate();

                if (i.customId === 'first') page = 1;
                if (i.customId === 'previous') page -= 1;
                if (i.customId === 'next') page += 1;
                if (i.customId === 'last') page = totalData;

                question.edit({
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>({
                            components: [
                                new StringSelectMenuBuilder({
                                    custom_id: 'penals',
                                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                                    options: penals.slice(page === 1 ? 0 : page * 25 - 25, page * 25).map((penal) => {
                                        return {
                                            label: `${types[penal.type]} (#${penal.id})`,
                                            description: 'Daha fazla bilgi için tıkla!',
                                            value: `${penal.id}`,
                                        };
                                    }),
                                }),
                            ],
                        }),
                        client.utils.paginationButtons(page, totalData),
                    ],
                });
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default Penals;

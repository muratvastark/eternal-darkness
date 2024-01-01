import { PenalFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import {
    ActionRowBuilder,
    bold,
    ButtonBuilder,
    ComponentType,
    EmbedBuilder,
    inlineCode,
    Interaction,
    StringSelectMenuBuilder,
    TextChannel,
} from 'discord.js';

const types = {
    [PenalFlags.Underworld]: 'Sunucudan Yasaklanma',
    [PenalFlags.ChatMute]: 'Sohbet Mutesi',
    [PenalFlags.VoiceMute]: 'Ses Mutesi',
    [PenalFlags.Quarantine]: 'Cezalı',
    [PenalFlags.ForceBan]: 'Kalıcı Ban',
};

const ReAddPenal: ICommand = {
    usages: ['repenal', 'resicil'],
    description: 'Kullanıcının silinmiş olan cezasını geri eklersiniz.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713', '1179554128347803669'],
    execute: async ({ client, message, args }) => {
        const user = await MemberManager.getUser(client, args[0]);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli Bir Kullanıcı Belirtmelisin!');
            return;
        }

        let penals = await PenalModel.find({ user: user.id, activity: false, visible: false });
        if (!penals.length) {
            client.utils.sendTimedMessage(message, 'Belirttiğin Kullanıcının Ceza Verisi Yok!');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'unpenal',
                    placeholder: `Herhangi bir ceza seçilmemiş! (${penals.length} ceza)`,
                    options: penals.slice(0, 25).map((penal) => {
                        return {
                            label: `${types[penal.type]} (#${penal.id})`,
                            description: 'Eklemek için tıkla!',
                            value: `${penal.id}`,
                        };
                    }),
                }),
            ],
        });

        let components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [row];
        const totalData = Math.ceil(penals.length / 25);
        let page = 1;
        if (penals.length > 25) components.push(client.utils.paginationButtons(page, totalData));

        const question = await message.channel.send({
            embeds: [
                embed.setDescription(
                    `${user} (${inlineCode(user.id)}) adlı kullanıcının geri eklenecek cezasını belirtiniz.`,
                ),
            ],
            components,
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.StringSelect,
        });

        collector.on('collect', async (i: Interaction) => {
            if (i.isStringSelectMenu()) {
                const penal = penals.find((p) => p.id === i.values[0]);
                if (!penal) {
                    question.edit({ content: 'Ceza zaten eklenmiş.', embeds: [], components: [] });
                    return;
                }

                collector.stop('FINISH');
                await PenalModel.updateOne({ id: i.values[0] }, { visible: true });

                const channel = message.guild.channels.cache.find((c) => c.name === 'penal-log') as TextChannel;
                if (channel) {
                    channel.send({
                        embeds: [
                            embed.setDescription(
                                `${message.author} (${inlineCode(
                                    message.author.id,
                                )}) adlı yetkili tarafından ${user} (${inlineCode(
                                    user.id,
                                )}) adlı kullanıcısının ${inlineCode(penal.id)} ID'li cezası geri eklendi.`,
                            ),
                        ],
                    });
                }

                question.edit({
                    content: `${user} (${inlineCode(user.id)}) adlı kullanıcının ${inlineCode(penal.id)} ID'li ${bold(
                        types[penal.type],
                    )} cezası geri eklendi.`,
                    components: [],
                    embeds: [],
                });
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

export default ReAddPenal;

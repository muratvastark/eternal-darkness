import { GuardManager } from '@/managers';
import { ChannelModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder } from '@discordjs/builders';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, inlineCode, time } from 'discord.js';

const DeletedChannels: ICommand = {
    usages: ["silinenkanallar", "silinenkanals", "sk", "dc", "deletedchannels"],
    execute: async ({ client, message }) => {
        const deletedChannels = await ChannelModel.find({ isDeleted: true });
        if (!deletedChannels.length) {
            client.utils.sendTimedMessage(message, "Silinen kanal bulunmuyor.");
            return;
        }

        let page = 1;
        const totalData = Math.ceil(deletedChannels.length / 5);
        const mappedDatas = deletedChannels.map((d) => `${d.name} ${inlineCode(d.id)} (${time(Math.floor(d.deletedTimestamp / 1000), "R")})`);

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: mappedDatas.slice(0, 10).join('\n'),
            footer: {
                text: `${deletedChannels.length} adet kanal silinmiş.`,
            },
        });

        const createButtonRow = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: "channel-create",
                    label: "Kanal Kur",
                    style: ButtonStyle.Success
                })
            ]
        })

        const question = await message.channel.send({
            embeds: [embed],
            components: deletedChannels.length > 10 ? [client.utils.paginationButtons(page, totalData), createButtonRow] : [createButtonRow],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            if (i.customId === "channel-create") {
                const idInputRow = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: "id",
                            label: "Kanal ID",
                            style: TextInputStyle.Short,
                            placeholder: "123456789123456789",
                            required: true
                        })
                    ]
                });

                await i.showModal(
                    new ModalBuilder({
                        custom_id: "modal",
                        title: "Silinen Kanalı Kur",
                        components: [idInputRow]
                    })
                );

                const modalCollected = await i.awaitModalSubmit({ time: 1000 * 60 });
                if (modalCollected) {
                    const channelId = modalCollected.fields.getTextInputValue("id");
                    const deletedChannel = deletedChannels.find(r => r.id === channelId);
                    if (!deletedChannel) {
                        modalCollected.reply({
                            content: "Belirttiğin kanala ait veri bulunmuyor.",
                            ephemeral: true
                        });
                        return;
                    }

                    GuardManager.createChannel(message.guild, deletedChannel);

                    modalCollected.reply({
                        content: `${deletedChannel.name} (${inlineCode(deletedChannel.id)}) adlı kanal kuruluyor.`,
                        ephemeral: true
                    });
                }
                return;
            }

            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            question.edit({
                embeds: [embed.setDescription(mappedDatas.slice(page === 1 ? 0 : page * 10 - 10, page * 10).join('\n'))],
                components: [client.utils.paginationButtons(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    }
}

export default DeletedChannels;

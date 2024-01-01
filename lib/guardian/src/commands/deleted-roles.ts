import { GuardManager } from '@/managers';
import { RoleModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder } from '@discordjs/builders';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle, inlineCode, time } from 'discord.js';

const DeletedRoles: ICommand = {
    usages: ["silinenroller", "silinenrols", "sr", "dr", "deletedroles"],
    execute: async ({ client, message }) => {
        const deletedRoles = await RoleModel.find({ isDeleted: true });
        if (!deletedRoles.length) {
            client.utils.sendTimedMessage(message, "Silinen rol bulunmuyor.");
            return;
        }

        let page = 1;
        const totalData = Math.ceil(deletedRoles.length / 5);
        const mappedDatas = deletedRoles.map((d) => `${d.name} ${inlineCode(d.id)} (${time(Math.floor(d.deletedTimestamp / 1000), "R")})`);

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: mappedDatas.slice(0, 10).join('\n'),
            footer: {
                text: `${deletedRoles.length} adet rol silinmiş.`,
            },
        });

        const createButtonRow = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: "role-create",
                    label: "Rol Kur",
                    style: ButtonStyle.Success
                })
            ]
        })

        const question = await message.channel.send({
            embeds: [embed],
            components: deletedRoles.length > 10 ? [client.utils.paginationButtons(page, totalData), createButtonRow] : [createButtonRow],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            if (i.customId === "role-create") {
                const idInputRow = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: "id",
                            label: "Rol ID",
                            placeholder: "123456789123456789",
                            style: TextInputStyle.Short,
                            required: true
                        })
                    ]
                });

                await i.showModal(
                    new ModalBuilder({
                        custom_id: "modal",
                        title: "Silinen Rolü Kur",
                        components: [idInputRow]
                    })
                );

                const modalCollected = await i.awaitModalSubmit({ time: 1000 * 60 });
                if (modalCollected) {
                    const roleId = modalCollected.fields.getTextInputValue("id");
                    const deletedRole = deletedRoles.find(r => r.id === roleId);
                    if (!deletedRole) {
                        modalCollected.reply({
                            content: "Belirttiğin role ait veri bulunmuyor.",
                            ephemeral: true
                        });
                        return;
                    }

                    GuardManager.createRole(message.guild, deletedRole, client.config.BOT.HELPER_TOKENS);

                    modalCollected.reply({
                        content: `${deletedRole.name} (${inlineCode(deletedRole.id)}) adlı rol kuruluyor.`,
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

export default DeletedRoles;

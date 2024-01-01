import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } from 'discord.js';

const InteractionCreate: Moonlight.IEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    execute: (_, interaction) => {
        if (interaction.isButton() && interaction.customId === 'speak-user') {
            interaction.deferUpdate();
            const buttonRow = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: 'taked',
                        disabled: true,
                        label: interaction.user.displayName,
                        style: ButtonStyle.Danger,
                    }),
                ],
            });
            interaction.message.edit({ components: [buttonRow] });
        }
    },
};

export default InteractionCreate;

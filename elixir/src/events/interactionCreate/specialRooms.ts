import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';

export default async function specialRooms(interaction: ButtonInteraction) {
    if (interaction.customId === 'sr-add-user') {
        interaction.showModal(
            new ModalBuilder({
                customId: 'sr-add-user',
                title: 'Eklenecek kullanıcıyı belirtin.',
                components: [
                    new ActionRowBuilder<TextInputBuilder>({
                        components: [
                            new TextInputBuilder({
                                style: TextInputStyle.Short,
                                custom_id: 'user',
                                label: 'Eklenecek Kullanıcı:',
                                placeholder: '511564136409202690',
                            }),
                        ],
                    }),
                ],
            }),
        );
    }

    if (interaction.customId === 'sr-remove-user') {
        interaction.showModal(
            new ModalBuilder({
                customId: 'sr-remove-user',
                title: 'Çıkarılacak kullanıcıyı belirtin.',
                components: [
                    new ActionRowBuilder<TextInputBuilder>({
                        components: [
                            new TextInputBuilder({
                                style: TextInputStyle.Short,
                                custom_id: 'user',
                                label: 'Çıkarılacak Kullanıcı:',
                                placeholder: '511564136409202690',
                            }),
                        ],
                    }),
                ],
            }),
        );
    }
}

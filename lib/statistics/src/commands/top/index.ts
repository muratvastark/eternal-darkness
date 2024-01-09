import { ActionRowBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import generalTopCanvas from './generalTopCanvas';
import getPagination from './getPagination';
import { ICommand } from '@/types';

const titlesAndKeys = {
    messages: 'Mesaj Sıralama',
    voices: 'Ses Sıralama',
    cameras: 'Kamera Sıralama',
    streams: 'Yayın Sıralama',
    invites: 'Davet Sıralama',
};

const Top: ICommand = {
    usages: ['top'],
    description: 'Genel sıralama',
    execute: async ({ client, message }) => {
        const typeRow = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'type',
                    placeholder: 'Sıralama kategorisini seç!',
                    options: Object.keys(titlesAndKeys).map((k) => ({ label: titlesAndKeys[k], value: k })),
                }),
            ],
        });

        const question = await message.channel.send({ components: [typeRow], files: [await generalTopCanvas(client)] });

        const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.StringSelect,
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            collector.stop();
            i.deferUpdate();
            getPagination(client, question, i.values[0], message.author.id);
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default Top;

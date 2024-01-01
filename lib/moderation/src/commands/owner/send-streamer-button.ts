import { ICommand } from '@/types';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const SendStreamerButton: ICommand = {
    usages: ['ssb'],
    description: 'özel',
    execute: ({ client, message }) => {
        if (!client.config.BOT.BOT_OWNERS.includes(message.author.id)) return;

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'streamer-owner',
                    label: 'Odayı Sahiplen',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'streamer-owner-change',
                    label: 'Odayı Aktar',
                    style: ButtonStyle.Primary,
                }),
            ],
        });

        message.channel.send({
            components: [row],
        });
    },
};

export default SendStreamerButton;

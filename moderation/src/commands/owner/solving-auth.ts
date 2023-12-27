import { ICommand } from '@/types';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } from 'discord.js';

const SolvingAuth: ICommand = {
    usages: ['solvingauthcall', 'solvingcall'],
    description: 'Sorun çözücü çağır mesajını attırırsınız.',
    execute: async ({ client, message }) => {
        if (!client.config.BOT.BOT_OWNERS.includes(message.author.id)) return;

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
        });
        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'solvingauth-call',
                    label: 'Sorun çözücü çağır',
                    style: ButtonStyle.Danger,
                    emoji: '1150607966198824970',
                }),
            ],
        });

        message.channel.send({
            components: [row],
        });
    },
};

export default SolvingAuth;

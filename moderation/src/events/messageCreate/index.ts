import { Events, bold, inlineCode } from 'discord.js';
import afkHandler from './afkHandler';
import botCommandHandler from './botCommandHandler';
import complimentHandler from './complimentHandler';
import guildCommandHandler from './guildCommandHandler';
import { IEvent } from '@/types';

const MessageCreate: IEvent<Events.MessageCreate> = {
    name: Events.MessageCreate,
    execute: async (client, message) => {
        if (!message.guild || message.author.bot || !message.content) return;

        const prefix = client.config.BOT.PREFIXES.find((prefix) => message.content.startsWith(prefix));
        afkHandler(client, message, prefix);
        if (!prefix) return;

        if (message.content.trim() === `${prefix}tag` && client.config.SERVER.TAGGED_SERVER) {
            client.utils.sendTimedMessage(message, client.config.SERVER.TAG);
            return;
        }

        if (['link', 'url'].some((u) => message.content.trim() === `${prefix}${u}`)) {
            const vanityURL = await message.guild.fetchVanityData();
            if (!vanityURL) {
                client.utils.sendTimedMessage(message, 'Bu sunucunun bir özel davet linki bulunmuyor.');
                return;
            }

            message.reply({
                content: [
                    `discord.gg/${message.guild.vanityURLCode}`,
                    bold(`Url Kullanımı: ${inlineCode(vanityURL.uses.toString())}`),
                ].join('\n'),
            });
        }

        botCommandHandler(client, message, prefix);
        guildCommandHandler(client, message, prefix);
        complimentHandler(client, message);
    },
};

export default MessageCreate;

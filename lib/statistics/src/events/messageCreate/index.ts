import { Events } from 'discord.js';
import botCommandHandler from './botCommandHandler';
import statHandler from './statHandler';
import { IEvent } from '@/types';

const MessageCreate: IEvent<Events.MessageCreate> = {
    name: Events.MessageCreate,
    execute: async (client, message) => {
        if (!message.guild || message.author.bot || !message.content.length) return;

        const prefix = client.config.BOT.PREFIXES.find((prefix) => message.content.startsWith(prefix));
        if (prefix) botCommandHandler(client, message, prefix);
        statHandler(client, message);
    },
};

export default MessageCreate;

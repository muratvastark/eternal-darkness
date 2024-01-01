import { IEvent } from '@/types';
import { Events } from 'discord.js';

const MessageDelete: IEvent<Events.MessageDelete> = {
    name: Events.MessageDelete,
    execute: (client, message) => {
        if (message.author.bot || !message.guild) return;

        const snipes = client.snipes.deleted.get(message.channel.id) || [];
        if (snipes.length >= 25) snipes.shift();
        snipes.push({
            id: message.id,
            content: message.content,
            author: message.author,
            attachments: message.attachments,
            timestamp: Date.now(),
        });
        client.snipes.deleted.set(message.channel.id, snipes);
    },
};

export default MessageDelete;

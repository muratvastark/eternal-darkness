import { IEvent } from '@/types';
import { Events } from 'discord.js';

const MessageUpdate: IEvent<Events.MessageUpdate> = {
    name: Events.MessageUpdate,
    execute: (client, message) => {
        if (message.author.bot || !message.guild) return;

        const snipes = client.snipes.updated.get(message.channel.id) || [];
        if (snipes.length >= 25) snipes.shift();
        snipes.push({
            id: message.id,
            content: message.content,
            author: message.author,
            attachments: message.attachments,
            timestamp: Date.now(),
        });
        client.snipes.updated.set(message.channel.id, snipes);
    },
};

export default MessageUpdate;

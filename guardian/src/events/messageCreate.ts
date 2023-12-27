import { Events, PermissionFlagsBits } from 'discord.js';
import { IEvent } from '@/types';

const MessageCreate: IEvent<Events.MessageCreate> = {
    name: Events.MessageCreate,
    execute: async (client, message) => {
        if (
            !message.guild ||
            message.author.bot ||
            !message.content.length ||
            !message.member.permissions.has(PermissionFlagsBits.Administrator)
        )
            return;

        const prefix = client.config.BOT.PREFIXES.find((prefix) => message.content.startsWith(prefix));
        if (!prefix) return;

        const [commandName, ...args] = message.content.slice(prefix.length).trim().split(' ');
        const command = client.commands.find((command) => command.usages.includes(commandName?.toLowerCase()));
        if (!command) return;

        command.execute({ client, message, args });
    },
};

export default MessageCreate;

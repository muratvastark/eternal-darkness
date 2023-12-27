import { Events, PermissionFlagsBits } from 'discord.js';
import botCommandHandler from './botCommandHandler';
import pointHandler from './pointHandler';
import { IEvent } from '@/types';
import { StaffManager } from '@/managers';

const MessageCreate: IEvent<Events.MessageCreate> = {
    name: Events.MessageCreate,
    execute: async (client, message) => {
        if (!message.guild || message.author.bot || !message.content.length) return;

        const prefix = client.config.BOT.PREFIXES.find((prefix) => message.content.startsWith(prefix));
        if (!prefix) return;

        const isCommand = await botCommandHandler(client, message, prefix);
        if (
            isCommand &&
            (StaffManager.checkStaff(message.member) ||
                message.member.permissions.has(PermissionFlagsBits.Administrator))
        )
            return;

        if (StaffManager.checkStaff(message.member)) pointHandler(client, message);
    },
};

export default MessageCreate;

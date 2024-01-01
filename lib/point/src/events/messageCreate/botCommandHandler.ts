import { Message, PermissionFlagsBits } from 'discord.js';
import { Client } from '@/base';

function botCommandHandler(client: Client, message: Message, prefix: string) {
    if (message.author.bot || !message.guild || !prefix) return false;

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(' ');
    const command = client.commands.find((command) => command.usages.includes(commandName?.toLowerCase()));
    const hasAdministrator = message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (
        !command ||
        message.channelId === client.config.SERVER.CHAT_CHANNEL ||
        (command.usableAuth &&
            !command.usableAuth.some((r) => message.member.roles.cache.has(r)) &&
            !hasAdministrator) ||
        (command.usableChannels && !command.usableChannels.includes(message.channelId) && !hasAdministrator)
    )
        return false;

    command.execute({ client, message, args });
    return true;
}

export default botCommandHandler;

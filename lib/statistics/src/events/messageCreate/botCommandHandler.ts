import { Message, PermissionFlagsBits } from 'discord.js';
import { Client } from '@/base';

function botCommandHandler(client: Client, message: Message, prefix: string) {
    if (message.author.bot || !message.guild || !prefix) return;

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(' ');
    const command = client.commands.find((command) => command.usages.includes(commandName?.toLowerCase()));
    const hasAdministrator = message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (
        !command ||
        ([
            client.config.SERVER.UNDERWORLD_ROLE,
            client.config.SERVER.QUARANTINE_ROLE,
            client.config.SERVER.UNREGISTER_ROLE,
        ].some((role) => message.member.roles.cache.has(role)) &&
            !hasAdministrator) ||
        (command.usableAuth &&
            !command.usableAuth.some((r) => message.member.roles.cache.has(r)) &&
            !hasAdministrator) ||
        (command.usableChannels && !command.usableChannels.includes(message.channelId) && !hasAdministrator) ||
        (message.channelId !== "1179791329748860968" && !hasAdministrator)
    )
        return;


    command.execute({ client, message, args });
}

export default botCommandHandler;

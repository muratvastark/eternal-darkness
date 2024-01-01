
import { Message, PermissionFlagsBits } from 'discord.js';
import { Client } from '@/base';
import { GuildCommandManager, MemberManager } from '@/managers';
import { LimitFlags } from '@/enums';

function botCommandHandler(client: Client, message: Message, prefix: string) {
    if (message.author.bot || !message.guild || !prefix) return;

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(' ');
    const command = client.commands.find((command) => command.usages.includes(commandName?.toLowerCase()));
    const hasAdministrator = message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!command) return;

    if ([
        client.config.SERVER.PENALS.UNDERWORLD.ROLE, 
        client.config.SERVER.PENALS.QUARANTINE.ROLE, 
        client.config.SERVER.UNREGISTER_ROLE
    ].some((role) => message.member.roles.cache.has(role)) && !hasAdministrator) return;
    if (command.usableAuth && !command.usableAuth.some((r) => message.member.roles.cache.has(r)) && !hasAdministrator) return;
    if (command.usableChannels && !command.usableChannels.includes(message.channelId) && !hasAdministrator) return;

    if (!hasAdministrator) {
        const limit = MemberManager.checkLimit(message.author.id, LimitFlags.Command, 10, 1000 * 20);
        if (limit.hasLimit) {
            const needTime = Number(limit.time.match(/\d+/)[0]);
            client.utils.sendTimedMessage(
                message,
                `Çok hızlı komut kullanıyorsun ${limit.time} bekle.`,
                Date.now() - needTime,
            );
            return;
        }
    }

    if (message.channelId === "1180836843659460658" && !["ban", "chatmute", "yargı", "jail", "voicemute", "snipe"].includes(command.usages[0]) && !hasAdministrator) return;

    console.log(command.usages)
    command.execute({ client, message, args });
    GuildCommandManager.logCommand(client, message, message.cleanContent);
}

export default botCommandHandler;

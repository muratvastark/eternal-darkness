import { Client } from '@/base';
import { LimitFlags } from '@/enums';
import { GuildCommandManager, MemberManager } from '@/managers';
import { IPunishCommand, IRoleCommand } from '@/types';
import { Message, PermissionFlagsBits } from 'discord.js';

function guildCommandHandler(client: Client, message: Message, prefix: string) {
    if (!message.content || !message.guild || message.author.bot) return;

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(' ');
    const command = [...client.config.SERVER.ROLE_COMMANDS, ...client.config.SERVER.PUNISMENT_COMMANDS].find(
        (command) => command.USAGES.map((u) => u.toLowerCase().trim()).includes(commandName?.toLowerCase()),
    );
    if (!command) return;

    const canExecute = command.AUTH.some((a) => message.member.roles.cache.has(a) || message.author.id === a);
    if (!canExecute && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    const limit = MemberManager.checkLimit(message.author.id, 1000, LimitFlags.Command, 1000 * 20);
    if (limit.hasLimit) {
        const needTime = Number(limit.time.match(/\d+/)[0]);
        client.utils.sendTimedMessage(
            message,
            `Çok hızlı komut kullanıyorsun ${limit.time} bekle.`,
            Date.now() - needTime,
        );
        return;
    }

    GuildCommandManager.logCommand(client, message, message.cleanContent);

    if (client.config.SERVER.ROLE_COMMANDS.some((c) => c.USAGES.includes(command.USAGES[0]))) {
        GuildCommandManager.roleCommand(client, message, args, command as IRoleCommand);
        return;
    }

    if (command.USAGES[0].startsWith('un'))
        GuildCommandManager.unPunishment(client, message, args, command as IPunishCommand);
    else GuildCommandManager.punishment(client, message, args, command as IPunishCommand);
}

export default guildCommandHandler;

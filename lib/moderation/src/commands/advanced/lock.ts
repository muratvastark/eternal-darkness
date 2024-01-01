import { ICommand } from '@/types';
import { EmbedBuilder, PermissionFlagsBits, Role, TextChannel, bold } from 'discord.js';

const Lock: ICommand = {
    usages: ['lock', 'kilit'],
    description: 'Yazılı sohbet kanalına yazmayı kapatır.',
    usableAuth: ['1179030512573091930'],
    execute: async ({ client, message }) => {
        const channel = message.channel as TextChannel;
        const role = message.guild.roles.everyone as Role;
        const hasPermission =
            !channel.permissionOverwrites.cache.get(role.id).allow.has(PermissionFlagsBits.SendMessages) &&
            !channel.permissionOverwrites.cache.get(role.id).deny.has(PermissionFlagsBits.SendMessages)
                ? false
                : null;
        channel.permissionOverwrites.edit(role.id, {
            SendMessages: hasPermission,
        });

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `Başarıyla kanal kilidi ${bold(hasPermission === null ? 'açıldı' : 'kapatıldı')}.`,
                }),
            ],
        });
    },
};

export default Lock;

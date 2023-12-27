import { ICommand } from '@/types';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
const channelNames = [
    'invite-log',
    'role-log',
    'quarantine-log',
    'chat-mute-log',
    'voice-mute-log',
    'message-log',
    'unfinished-penals',
    'level-log',
    'staff-tag-log',
    'tag-log',
    'suspect-log',
    'banned-tag-log',
    'register-log',
    'voice-log',
    'meeting-log',
    'solving-auth-call',
    'staff-rank-up',
    'bonus-log',
    'yetkisi-çekilenler',
    'take-staff-log',
];

const CreateLogs: ICommand = {
    usages: ['create-logs'],
    description: 'Create logs channel',
    execute: async ({ client, message }) => {
        if (!client.config.BOT.BOT_OWNERS.includes(message.author.id)) return;

        const logsCategory = await message.guild.channels.create({
            name: 'Bot Logs',
            type: ChannelType.GuildCategory,
            position: 99,
            permissionOverwrites: [
                {
                    id: message.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
            ],
        });

        const loadingMessage = await message.channel.send('Kanallar oluşturuluyor...');

        await Promise.all(
            channelNames.map(async (name) => {
                return await message.guild.channels.create({
                    name,
                    type: ChannelType.GuildText,
                    parent: logsCategory.id,
                    permissionOverwrites: [
                        {
                            id: message.guild.roles.everyone,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                    ],
                });
            }),
        ).finally(() => loadingMessage.edit('Kanallar oluşturuldu.'));
    },
};

export default CreateLogs;

import { GuardManager } from '@/managers';
import { ChannelModel, RoleModel } from '@/models';
import { IEvent } from '@/types';
import { Events } from 'discord.js';

const Ready: IEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    execute: async (client) => {
        console.log(`Logged in as ${client.user?.tag}!`);

        const guild = client.guilds.cache.get(client.config.BOT.GUILD_ID);
        if (!guild) {
            throw new Error('Guild not found');
        }

        await guild.fetch();

        GuardManager.guildSettings = {
            name: guild.name,
            banner: guild.bannerURL(),
            icon: guild.iconURL(),
            splash: guild.splashURL(),
            discoverySplash: guild.discoverySplashURL(),
        };

        const now = Date.now();

        await RoleModel.updateMany(
            { $nor: guild.roles.cache.map((role) => ({ id: role.id })), isDeleted: false },
            { isDeleted: true, deletedTimestamp: now },
        );

        await ChannelModel.updateMany(
            { $nor: guild.channels.cache.map((channel) => ({ id: channel.id })), isDeleted: false },
            { isDeleted: true, deletedTimestamp: now },
        );

        await GuardManager.getBackup(guild);
        setInterval(() => GuardManager.getBackup(guild), 1000 * 60 * 60 * 2);
    },
};

export default Ready;

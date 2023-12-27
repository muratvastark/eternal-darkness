import { PenalManager, RoleManager } from '@/managers';
import { monthlyRole, voteMessage } from '@/jobs';
import { Events } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';

const Ready: Moonlight.IEvent<Events.ClientReady> = {
    name: Events.ClientReady,
    execute: async (client) => {
        console.log(`Logged in as ${client.user?.tag}!`);

        const guild = client.guilds.cache.get(client.config.BOT.GUILD_ID);
        if (!guild) {
            throw new Error('Guild not found');
        }

        joinVoiceChannel({
            channelId: "1179371470208630824",
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true
        });

        voteMessage(guild);
        monthlyRole(client, guild);

        await guild.members.fetch();

        RoleManager.checkRoles(client, guild);
        setInterval(() => RoleManager.checkRoles(client, guild), 5 * 60 * 1000);

        PenalManager.checkPenals(client, guild);
        setInterval(() => PenalManager.checkPenals(client, guild), 10 * 1000);
    },
};

export default Ready;

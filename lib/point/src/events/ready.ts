import { autoDown } from '@/jobs';
import { MemberManager, StaffManager } from '@/managers';
import { IEvent } from '@/types';
import { joinVoiceChannel } from '@discordjs/voice';
import { Events, VoiceChannel } from 'discord.js';

const Ready: IEvent<Events.ClientReady> = {
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
            adapterCreator: guild.voiceAdapterCreator
        })

        autoDown(guild);

        await guild.members.fetch();

        const invites = await guild.invites.fetch();
        invites.forEach((i) => StaffManager.invites.set(i.code, { code: i.code, inviter: i.inviter, uses: i.uses }));

        const updateAt = Date.now();
        guild.members.cache
            .filter((m) => m.voice.channelId && StaffManager.checkStaff(m) && !m.user.bot)
            .forEach((m) => StaffManager.voices.set(m.id, { channelId: m.voice.channelId, updateAt }));

        setInterval(() => {
            const now = Date.now();
            StaffManager.voices.forEach(async (v, k) => {
                const member = await MemberManager.getMember(guild, k);
                if (!member || !member.voice) return;

                const diff = now - v.updateAt;
                if (diff > 0) StaffManager.addVoiceStat(member, member.voice.channel as VoiceChannel, diff);
                v.updateAt = now;
            });
        }, 1000 * 60);
    },
};

export default Ready;

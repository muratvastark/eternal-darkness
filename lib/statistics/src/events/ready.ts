import { MemberManager, StatManager } from '@/managers';
import { UserModel } from '@/models';
import { IEvent } from '@/types';
import { joinVoiceChannel } from '@discordjs/voice';
import { Events, VoiceChannel } from 'discord.js';

const ONE_MINUTE = 60 * 1000;

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
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true
        });

        await guild.members.fetch();

        const invites = await guild.invites.fetch();
        invites.forEach((i) =>
            StatManager.invites.set(i.code, {
                code: i.code,
                inviter: i.inviter,
                uses: i.uses,
            }),
        );

        const updateAt = Date.now();
        const voiceMembers = guild.members.cache.filter((m) => m.voice.channelId && !m.user.bot);

        voiceMembers.forEach((m) =>
            StatManager.voices.set(m.id, { channelId: m.voice.channelId, updateAt, joinedAt: updateAt }),
        );

        voiceMembers
            .filter((m) => m.voice.streaming)
            .forEach((m) => {
                StatManager.streams.set(m.id, { channelId: m.voice.channelId, updateAt });
                StatManager.addCount(m.id, 'streams');
            });

        voiceMembers
            .filter((m) => m.voice.selfVideo)
            .forEach((m) => {
                StatManager.cameras.set(m.id, { channelId: m.voice.channelId, updateAt });
                StatManager.addCount(m.id, 'cameras');
            });

        setInterval(() => {
            const now = Date.now();
            StatManager.voices.forEach(async (v, k) => {
                const member = await MemberManager.getMember(guild, k);
                const diff = now - v.updateAt;
                if (diff > 0) StatManager.addVoiceStat(member, member.voice.channel as VoiceChannel, diff);
                v.updateAt = now;
            });

            StatManager.streams.forEach(async (v, k) => {
                const member = await MemberManager.getMember(guild, k);
                const diff = now - v.updateAt;
                if (diff > 0) StatManager.addStat(member, diff, 'streams');
                v.updateAt = now;
            });

            StatManager.cameras.forEach(async (v, k) => {
                const member = await MemberManager.getMember(guild, k);
                const diff = now - v.updateAt;
                if (diff > 0) StatManager.addStat(member, diff, 'cameras');
                v.updateAt = now;
            });
        }, ONE_MINUTE);
    },
};

export default Ready;

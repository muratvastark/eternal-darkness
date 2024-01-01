import { GiveawayManager, MemberManager } from '@/managers';
import { StreamModel } from '@/models';
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
            channelId: '1179371470208630824',
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
        });

        await guild.members.fetch();

        await GiveawayManager.init();

        client.config.SERVER.PUNISMENT_COMMANDS = [
            ...client.config.SERVER.PUNISMENT_COMMANDS,
            ...client.config.SERVER.PUNISMENT_COMMANDS.map((c) => ({ ...c, USAGES: c.USAGES.map((c) => `un${c}`) })),
        ];

        const streams = await StreamModel.find();
        client.streams = streams.map(({ id, ownerId }) => ({ channelId: id, ownerId }));

        streams.forEach(async (stream) => {
            const member = await MemberManager.getMember(guild, stream.ownerId);
            const channel = guild.channels.cache.get(stream.id) as VoiceChannel;
            if (!channel || !member || !member.voice.channel || member.voice.channelId !== stream.id) {
                client.streams = client.streams.filter(({ channelId }) => channelId !== stream.id);
                channel.permissionOverwrites.set(
                    stream.permissions.map((perm) => ({
                        id: perm.id,
                        allow: BigInt(perm.allow),
                        deny: BigInt(perm.deny),
                    })),
                );
                channel.edit({ name: stream.name, userLimit: 0 });
                stream.deleteOne();
                return;
            }
        });

        setInterval(() => {
            const now = Date.now();
            MemberManager.limits.sweep((limit) => now - limit.lastUsage >= 1000 * 60 * 60);
            client.cooldowns.sweep((cooldown) => now - cooldown >= 1000 * 60 * 60);
        }, 1000 * 60);

        GiveawayManager.checkGiveaways(guild);
        setInterval(async () => GiveawayManager.checkGiveaways(guild), 1000 * 10);
    },
};

export default Ready;

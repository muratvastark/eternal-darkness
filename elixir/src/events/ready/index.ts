import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, TextChannel } from 'discord.js';
import { joinVoiceChannel } from '@discordjs/voice';
import { IEvent } from '@/types';
import checkChannels from './checkChannels';

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

        // const channel = guild.channels.cache.get('1179548952618614834') as TextChannel;
        // if (channel) {
        //     channel.send({
        //         components: [
        //             new ActionRowBuilder<ButtonBuilder>({
        //                 components: [
        //                     new ButtonBuilder({
        //                         custom_id: 'sr-add-user',
        //                         label: 'Kullanıcı Ekle',
        //                         style: ButtonStyle.Success,
        //                     }),
        //                     new ButtonBuilder({
        //                         custom_id: 'sr-remove-user',
        //                         label: 'Kullanıcı Çıkar',
        //                         style: ButtonStyle.Danger,
        //                     }),
        //                 ],
        //             }),
        //         ],
        //     });
        // }

        // const channel = guild.channels.cache.get('1185576053830320210') as TextChannel;
        // if (channel) {
        //     channel.send({
        //         components: [
        //             new ActionRowBuilder<ButtonBuilder>({
        //                 components: [
        //                     new ButtonBuilder({
        //                         custom_id: 'problem-resolve-ticket',
        //                         label: 'Sorun Çözme Destek',
        //                         style: ButtonStyle.Secondary,
        //                     }),
        //                     new ButtonBuilder({
        //                         custom_id: 'normal-ticket',
        //                         label: 'Normal Destek',
        //                         style: ButtonStyle.Secondary,
        //                     }),
        //                 ],
        //             }),
        //         ],
        //     });
        // }

        checkChannels(client, guild);
        setInterval(() => checkChannels(client, guild), 1000 * 60 * 5);
    },
};

export default Ready;

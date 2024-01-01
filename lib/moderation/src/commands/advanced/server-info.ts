import { ICommand } from '@/types';
import { EmbedBuilder, bold, inlineCode } from 'discord.js';

const Info: ICommand = {
    usages: ['info', 'say'],
    description: 'Sunucunun anlık verisini gösterir.',
    usableAuth: ['1179030512573091930', '1179566358434939032', '1179568355343089765', '1179403561747095552'],
    execute: async ({ client, message }) => {
        const botCommandRole = message.guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        const adminRole = message.guild.roles.cache.get('1179554144130969713');
        const members = await message.guild.members.fetch();
        const voiceMembers = members.filter((m) => m.voice.channelId).size;
        const staffVoiceMembers = members.filter(
            (m) => m.voice.channelId && m.roles.highest.position >= botCommandRole.position,
        ).size;
        const adminVoiceMembers = members.filter(
            (m) => m.voice.channelId && m.roles.highest.position >= adminRole.position,
        ).size;

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: [
                        `${inlineCode('>')} Şuan sesli kanallarda ${bold(voiceMembers.toString())} aktif üye var.`,
                        `${inlineCode('>')} Şuan sesli kanallarda ${bold(
                            staffVoiceMembers.toString(),
                        )} (${adminVoiceMembers} yönetim) aktif yetkili var.`,
                        `${inlineCode('>')} Şuan sunucuda toplam ${bold(members.size.toString())} üye var.`,
                        `${inlineCode('>')} Şuan sunucuda toplam ${bold(
                            message.guild.premiumSubscriptionCount.toString(),
                        )} (${message.guild.premiumTier} seviye) boost var.`,
                    ].join('\n'),
                }),
            ],
        });
    },
};

export default Info;

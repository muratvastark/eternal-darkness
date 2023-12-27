import { PenalFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { PenalModel } from '@/models';
import { Client } from '@/base';
import {
    ActionRowBuilder,
    bold,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    GuildMember,
    inlineCode,
    Message,
    TextChannel,
} from 'discord.js';
import { ICommand } from '@/types';

const UnMute: ICommand = {
    usages: ['unmute'],
    description: 'Muteli bir kullanıcının mutesini kaldırırsınız.',
    usableAuth: [
        '1179554153362628669',
        '1179554128347803669',
        '1179554144130969713',
        '1179403561747095552',
        '1179030512573091930',
        '1179566334460317808',
        '1179568335713730570',
    ],
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await MemberManager.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const hasVoiceMute = member.roles.cache.has(client.config.SERVER.PENALS.VOICE_MUTE.ROLE);
        if (!hasVoiceMute && !member.roles.cache.has(client.config.SERVER.PENALS.CHAT_MUTE.ROLE)) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        if (hasVoiceMute && member.roles.cache.has(client.config.SERVER.PENALS.CHAT_MUTE.ROLE)) {
            const row = new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: 'voice_mute',
                        style: ButtonStyle.Secondary,
                        emoji: {
                            id: '848034896948494367',
                        },
                    }),
                    new ButtonBuilder({
                        custom_id: 'chat_mute',
                        style: ButtonStyle.Secondary,
                        emoji: {
                            id: '848035393471381504',
                        },
                    }),
                ],
            });
            const question = await message.reply({
                content: member.toString(),
                embeds: [
                    embed.setDescription(
                        'Kullanıcının iki tür susturmadan cezası bulunuyor, aşağıdaki düğmelerden hangisini kaldıracağınızı seçin.',
                    ),
                ],
                components: [row],
            });

            const filter = (i) => i.user.id === message.author.id;
            const collected = await question.awaitMessageComponent({
                filter,
                time: 15000,
                componentType: ComponentType.Button,
            });
            if (collected) {
                collected.deferUpdate();

                let text;
                if (collected.customId === 'chat_mute') {
                    text = 'yazılı susturması';
                    member.roles.remove(client.config.SERVER.PENALS.CHAT_MUTE.ROLE);
                    await PenalModel.updateMany(
                        { user: member.id, activity: true, type: PenalFlags.ChatMute, visible: true },
                        {
                            $set: {
                                activity: false,
                                remover: message.author.id,
                                removeTime: Date.now(),
                                removeReason: reason,
                            },
                        },
                    );
                } else {
                    text = 'ses susturması';
                    if (!member.roles.cache.has(client.config.SERVER.PENALS.VOICE_MUTE.ROLE))
                        member.roles.remove(client.config.SERVER.PENALS.VOICE_MUTE.ROLE);
                    if (member.voice.channelId) member.voice.setMute(false);

                    await PenalModel.updateMany(
                        { user: member.id, activity: true, type: PenalFlags.VoiceMute, visible: true },
                        {
                            $set: {
                                activity: false,
                                remover: message.author.id,
                                removeTime: Date.now(),
                                removeReason: reason,
                            },
                        },
                    );
                }

                question.edit({
                    components: [],
                    embeds: [
                        embed.setDescription(
                            `${member} (${inlineCode(member.id)}) adlı kullanıcının ${bold(text)} kaldırıldı.`,
                        ),
                    ],
                });

                sendLog(
                    client,
                    message,
                    member,
                    collected.customId === 'chat_mute' ? 'chat-mute-log' : 'voice-mute-log',
                    reason,
                );
            } else {
            }
            return;
        }

        await PenalModel.updateMany(
            {
                user: member.id,
                activity: true,
                visible: true,
                $or: [{ type: PenalFlags.VoiceMute }, { type: PenalFlags.ChatMute }],
            },
            {
                $set: {
                    activity: false,
                    remover: message.author.id,
                    removeTime: Date.now(),
                    removeReason: reason,
                },
            },
        );

        message.channel.send({
            embeds: [embed.setDescription(`${member} kullanıcısının başarıyla cezası kaldırıldı.`)],
        });

        sendLog(
            client,
            message,
            member,
            message.member.roles.cache.has(client.config.SERVER.PENALS.CHAT_MUTE.ROLE)
                ? 'chat-mute-log'
                : 'voice-mute-log',
            reason,
        );

        if (member.voice.channelId) member.voice.setMute(false);
        member.roles.remove([client.config.SERVER.PENALS.CHAT_MUTE.ROLE, client.config.SERVER.PENALS.VOICE_MUTE.ROLE]);
    },
};

export default UnMute;

async function sendLog(client: Client, message: Message, member: GuildMember, channelName: string, reason: string) {
    const channel = message.guild.channels.cache.get(channelName) as TextChannel;
    if (!channel) return;

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${member} (${inlineCode(member.id)}) adlı kullanıcının cezası ${
                    message.author
                } (${inlineCode(message.author.id)}) tarafından ${bold(reason)} sebebiyle süresi dolmadan kaldırıldı.`,
            }),
        ],
    });
}

import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder } from 'discord.js';

const PunishPoint: ICommand = {
    usages: ['cp', 'cezapuan'],
    description: 'Ceza puanını gösterir.',
    execute: async ({ client, message, args }) => {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) {
            client.utils.sendTimedMessage(message, 'Bir kullanıcı belirtmelisin.');
            return;
        }

        const points = {
            [PenalFlags.Underworld]: client.config.SERVER.PENALS.UNDERWORLD.POINT,
            [PenalFlags.ChatMute]: client.config.SERVER.PENALS.CHAT_MUTE.POINT,
            [PenalFlags.VoiceMute]: client.config.SERVER.PENALS.VOICE_MUTE.POINT,
            [PenalFlags.Quarantine]: client.config.SERVER.PENALS.QUARANTINE.POINT,
            [PenalFlags.ForceBan]: 1000,
        };

        const penals = await PenalModel.find({ user: member.id, visible: true }).select('type');

        if (!penals.length) {
            client.utils.sendTimedMessage(message, 'Bu kullanıcıda bir ceza puanı yok.');
            return;
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: member.user.displayName,
                        iconURL: member.user.displayAvatarURL({ forceStatic: true }),
                    },
                    description: `${member} kullanıcısına ait ${penals.reduce(
                        (a, b) => a + points[b.type],
                        0,
                    )} ceza puanı mevcut.`,
                }),
            ],
        });
    },
};

export default PunishPoint;

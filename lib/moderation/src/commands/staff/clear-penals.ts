import { MemberManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, inlineCode, TextChannel } from 'discord.js';

const ClearPenals: ICommand = {
    usages: ['st', 'siciltemizle', 'sicil-temizle'],
    description: 'Kullanıcının bütün sicil verilerini sıfırlar.',
    usableAuth: ['1179030512573091930', '1179403561747095552'],
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli Bir Kullanıcı Belirtmelisin!');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        await PenalModel.updateMany({ user: user.id }, { visible: false });

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${user} adlı kullanıcının bütün sicil verileri sıfırlandı.`,
                    author: {
                        name: message.author.username,
                        iconURL: message.author.displayAvatarURL({ forceStatic: true }),
                    },
                }),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === 'penal-log') as TextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        `${message.author} (${inlineCode(
                            message.author.id,
                        )}) adlı yetkili tarafından ${user} (${inlineCode(
                            user.id,
                        )}) adlı kullanıcısının bütün cezaları kaldırıldı.`,
                    ),
                ],
            });
        }
    },
};

export default ClearPenals;

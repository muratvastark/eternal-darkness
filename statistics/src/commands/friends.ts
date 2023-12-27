import { UserModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, EmbedField, inlineCode, userMention } from 'discord.js';

const Friends: ICommand = {
    usages: ['arkadaşlarım', 'arkadaşlar', 'friends', 'friend'],
    description: 'Sunucuda en çok vakit geçirilen insanlar.',
    execute: async ({ client, message }) => {
        const document = await UserModel.findOne({ id: message.author.id });
        if (!document) {
            client.utils.sendTimedMessage(message, 'Verin bulunmuyor.');
            return;
        }

        const chatFriends = Object.keys(document.chatFriends || {});
        const voiceFriends = Object.keys(document.voiceFriends || {});

        if (!voiceFriends.length && !chatFriends.length) {
            client.utils.sendTimedMessage(message, 'Hiç arkadaşın yok :c');
            return;
        }

        const sortedVoiceFriends = voiceFriends
            .sort((a, b) => document.voiceFriends[b] - document.voiceFriends[a])
            .slice(0, 10);
        const sortedChatFriends = chatFriends
            .sort((a, b) => document.chatFriends[b] - document.chatFriends[a])
            .slice(0, 10);

        const fields: EmbedField[] = [];

        if (voiceFriends.length) {
            fields.push(
                {
                    name: 'Ses Arkadaşların',
                    value: voiceFriends
                        .slice(0, 10)
                        .map((u, i) => `${inlineCode(i === 0 ? '❤️' : `${i + 1}.`)} ${userMention(u)}`)
                        .join('\n'),
                    inline: true,
                },
                {
                    name: 'Geçirdiğin Süre',
                    value: sortedVoiceFriends
                        .map((u) => client.utils.numberToString(document.voiceFriends[u]))
                        .join('\n'),
                    inline: true,
                },
                {
                    name: '\u0020',
                    value: '\u0020',
                    inline: true,
                },
            );
        }

        if (chatFriends.length) {
            fields.push(
                {
                    name: 'Mesaj Arkadaşların',
                    value: sortedChatFriends
                        .map((u, i) => `${inlineCode(i === 0 ? '❤️' : `${i + 1}.`)} ${userMention(u)}`)
                        .join('\n'),
                    inline: true,
                },
                {
                    name: 'Mesaj Sayısı',
                    value: sortedChatFriends.map((u) => `${document.chatFriends[u]} mesaj`).join('\n'),
                    inline: true,
                },
                {
                    name: '\u0020',
                    value: '\u0020',
                    inline: true,
                },
            );
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    fields: fields,
                }),
            ],
        });
    },
};

export default Friends;

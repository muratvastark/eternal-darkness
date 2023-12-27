import { MemberManager } from '@/managers';
import { ICommand } from '@/types';
import { EmbedBuilder, TextChannel, bold, inlineCode } from 'discord.js';

const Clear: ICommand = {
    usages: ['clear', 'sil', 'temizle'],
    description: 'Kanalda belirtilen sayıda mesaj siler. (Dilerseniz spesifik bir kullanıcı da belirtebilirsiniz)',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713'],
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await MemberManager.getUser(client, args[0])) || reference;
        const count = parseInt(args[reference ? 0 : user ? 1 : 0]);
        if (!count || count < 1) {
            client.utils.sendTimedMessage(message, 'Lütfen silmek için değer belirt.');
            return;
        }

        if (count > 100) {
            client.utils.sendTimedMessage(message, 'En fazla 100 tane silebilirsin.');
            return;
        }

        const messages = await message.channel.messages.fetch({ limit: count });

        const deleteMessages: string[] = user
            ? [...messages.values()].filter((msg) => msg.author.id === user.id).map((m) => m.id)
            : messages.map((m) => m.id);
        if (!deleteMessages.length) {
            client.utils.sendTimedMessage(
                message,
                user
                    ? `${user} (${inlineCode(user.id)}) adlı kullanıcının mesajı bulunmuyor.`
                    : 'Kanalda mesaj bulunmuyor.',
            );
            return;
        }

        const deletedMessages = await (message.channel as TextChannel).bulkDelete(deleteMessages, true);
        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: message.author.username,
                        icon_url: message.author.displayAvatarURL(),
                    },
                    description: user
                        ? `${user} (${inlineCode(user.id)}) adlı kullanıcının ${bold(
                              deletedMessages.size.toString(),
                          )} adet mesajı silindi.`
                        : `Başarıyla ${bold(deletedMessages.size.toString())} adet mesaj silindi.`,
                }),
            ],
        });
    },
};

export default Clear;

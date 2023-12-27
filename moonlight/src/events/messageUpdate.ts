import { codeBlock, Colors, EmbedBuilder, Events, TextChannel } from 'discord.js';

const MessageUpdate: Moonlight.IEvent<Events.MessageUpdate> = {
    name: Events.MessageUpdate,
    execute: async (_, oldMessage, newMessage) => {
        if (oldMessage.author.bot || !oldMessage.guild) return;

        const channel = oldMessage.guild.channels.cache.find((c) => c.name === 'message-log') as TextChannel;
        if (!channel) return;

        const differentAttachments = oldMessage.attachments.difference(newMessage.attachments);
        const embed = new EmbedBuilder({
            color: Colors.Yellow,
            url: 'https://starkva.me',
            description: [
                codeBlock(
                    'yaml',
                    [
                        `# ${
                            differentAttachments.size > 0 && oldMessage.cleanContent !== newMessage.cleanContent
                                ? 'Mesaj Güncellendi!'
                                : differentAttachments.size > 0
                                  ? 'Mesajdaki Resim Kaldırıldı!'
                                  : 'Mesaj İçeriği Güncellendi!'
                        }`,
                        `Mesaj Sahibi: ${newMessage.author.displayName} (${newMessage.author.id})`,
                        `Kanal: ${(newMessage.channel as TextChannel).name} (${newMessage.channel.id})`,
                        `Mesaj Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                        })}`,
                    ].join('\n'),
                ),
                oldMessage.cleanContent !== newMessage.cleanContent
                    ? [
                          codeBlock('yaml', ['# Eski Mesaj', `${oldMessage.cleanContent}`].join('\n')),
                          codeBlock('yaml', ['# Yeni Mesaj', `${newMessage.cleanContent}`].join('\n')),
                      ].join('')
                    : undefined,
                differentAttachments.size > 0 ? codeBlock('yaml', '# Silinen Resim') : undefined,
            ]
                .filter(Boolean)
                .join(''),
            footer: {
                text: `Mesaj ID: ${oldMessage.id}`,
            },
        });

        const anotherEmbeds = [...differentAttachments.values()].map((img) => {
            return new EmbedBuilder({
                url: 'https://starkva.me',
                image: {
                    url: img.proxyURL,
                },
            });
        });

        channel.send({ embeds: [embed, ...anotherEmbeds] });
    },
};
export default MessageUpdate;

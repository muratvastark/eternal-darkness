import { AuditLogEvent, codeBlock, Colors, EmbedBuilder, Events, TextChannel } from 'discord.js';

const MessageDelete: Moonlight.IEvent<Events.MessageDelete> = {
    name: Events.MessageDelete,
    execute: async (client, message) => {
        if (message.author.bot || !message.guild || message.embeds.length > 0) return;

        const channel = message.guild.channels.cache.find((c) => c.name === 'message-log') as TextChannel;
        if (!channel) return;

        const entry = await message.guild
            .fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete })
            .then((audit) => audit.entries.first());

        const defaultEmbed = new EmbedBuilder({
            color: Colors.Red,
            description: [
                codeBlock(
                    'yaml',
                    [
                        '# Mesaj Silindi!',
                        `Mesaj Sahibi: ${message.author.displayName} (${message.author.id})`,
                        entry &&
                        entry.executorId !== client.user.id &&
                        entry.executorId !== message.author.id &&
                        entry.targetId === message.author.id
                            ? `Mesajı Silen: ${entry.executor.displayName} (${entry.executorId})`
                            : undefined,
                        `Kanal: ${(message.channel as TextChannel).name} (${message.channel.id})`,
                        `Mesaj Oluşturulma Tarihi: ${new Date(message.createdTimestamp).toLocaleString('tr-TR', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                        })}`,
                    ]
                        .filter(Boolean)
                        .join('\n'),
                ),
                message.cleanContent.length ? codeBlock('fix', message.cleanContent) : undefined,
            ]
                .filter(Boolean)
                .join(''),
            url: 'https://starkva.me',
            footer: {
                text: `Mesaj ID: ${message.id}`,
            },
        });

        const anotherEmbeds = [...message.attachments.values()].map((img) => {
            return new EmbedBuilder({
                url: 'https://starkva.me',
                image: {
                    url: img.proxyURL,
                },
            });
        });

        channel.send({ embeds: [defaultEmbed, ...anotherEmbeds] });
    },
};

export default MessageDelete;

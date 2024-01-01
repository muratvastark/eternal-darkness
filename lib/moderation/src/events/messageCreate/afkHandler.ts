import { Message, time, EmbedBuilder, bold, APIEmbedField, userMention } from 'discord.js';

import { Client } from '@/base';

async function afkHandler(client: Client, message: Message, prefix: string) {
    if (prefix && message.content?.toLowerCase().startsWith(`${prefix}afk`)) return;

    const embed = new EmbedBuilder({
        color: client.utils.getRandomColor(),
    });

    const displayName = message.member.displayName;
    if (displayName.startsWith('[AFK]')) {
        message.member.setNickname(displayName.replace(/\[AFK\] ?/g, ''));
    }

    const afkData = client.afks.get(message.author.id);
    if (afkData) {
        embed.setDescription(`${message.author}, artık ${bold('AFK')} olarak gözükmüyorsun`);
        if (afkData.mentions.length) {
            embed.addFields([
                {
                    name: 'Sen yokken seni etiketleyen kullanıcılar',
                    value: afkData.mentions
                        .map((m) => `${userMention(m.user)} (${time(m.timestamp)})`)
                        .join('\n'),
                },
            ]);
        }

        message.channel.send({ embeds: [embed] }).then((msg) => setTimeout(() => msg.delete(), 5000));

        client.afks.delete(message.author.id)
        return;
    }

    const mentions = message.mentions.users;
    if (mentions.size > 1 && 25 >= mentions.size) {
        const afks = client.afks.filter((_, k) => message.mentions.users.get(k));
        const now = Math.floor(Date.now() / 1000);
        const fields: APIEmbedField[] = [];
        afks.forEach((afk, id) => {
            afk.mentions.push({ user: message.author.id, timestamp: now });

            const user = mentions.find((u) => u.id === id);
            const afkDurationFormatted = time(Math.floor(afk.timestamp / 1000), 'R');
            fields.push({
                name: `${user.username}`,
                value: `Sebep: ${afk.reason || 'Sebep belirtilmemiş.'}\n AFK Süresi: ${afkDurationFormatted}`,
                inline: false,
            });
        });

        message
            .reply({
                embeds: [
                    embed
                        .setDescription(null)
                        .setTitle(`Belirttiğin ${mentions.size > 1 ? 'Kullanıcılar' : 'Kullanıcı'} AFK!`)
                        .setFields(fields),
                ],
            })
            .then((msg) => setTimeout(() => msg.delete(), 4000));
    }
}

export default afkHandler;

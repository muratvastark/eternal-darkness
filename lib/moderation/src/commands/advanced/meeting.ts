import { ICommand } from '@/types';
import { EmbedBuilder, TextChannel, inlineCode } from 'discord.js';

const Joined: ICommand = {
    usages: ['katıldı'],
    description: 'Odadaki üyelere katıldı rolü verir.',
    usableAuth: ['1179403561747095552', '1179030512573091930'],
    execute: async ({ client, message }) => {
        const channel = message.member.voice.channel;
        if (!channel) return client.utils.sendTimedMessage(message, 'Bir ses kanalında bulunman gerekiyor.');

        const members = channel.members.filter((member) => !member.user.bot);
        if (!members.size) return client.utils.sendTimedMessage(message, 'Katıldı rolu verilecek uye bulunamadı.');

        const unjoinedMembers = message.guild.members.cache.filter(
            (m) =>
                m.roles.cache.has(client.config.SERVER.JOINED_ROLE) &&
                m.voice.channelId &&
                m.voice.channelId === channel.id,
        );

        unjoinedMembers.forEach((m) => m.roles.remove(client.config.SERVER.JOINED_ROLE));

        members.forEach((member) => member.roles.add(client.config.SERVER.JOINED_ROLE));

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: 'Sesteki üyelerin katıldı rolu verildi. Eskiden sahip olanlardan alındı.',
                }),
            ],
        });

        const logChannel = message.guild.channels.cache.find((c) => c.name === 'meeting-log') as TextChannel;
        if (!logChannel) return;

        const splitedMessages = client.utils.splitMessage(
            `Katılan Üyeler: ${members
                .map((m) => `${m} (${inlineCode(m.id)})`)
                .join(', ')}\n\nKatılmayanlar: ${unjoinedMembers.map((m) => `${m} (${inlineCode(m.id)})`).join(', ')}`,
        );

        for (const splitMessage of splitedMessages) logChannel.send(splitMessage);
    },
};

export default Joined;

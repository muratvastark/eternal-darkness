import { UserModel } from '@/models';
import { StatManager } from '@/managers';
import { Collection, Message, TextChannel, bold, inlineCode } from 'discord.js';
import { Client } from '@/base';

const messageCooldowns = new Collection<string, number>();

setInterval(() => {
    const now = Date.now();
    messageCooldowns.sweep((cooldown) => now - cooldown >= 1000 * 60);
}, 1000 * 10);

const ONE_DAY = 1000 * 60 * 60 * 24;

async function statHandler(client: Client, message: Message) {
    if (message.author.bot || !message.guild) return;

    const now = new Date();
    const document = (await UserModel.findOne({ id: message.author.id })) || new UserModel({ id: message.author.id });
    const diff = now.valueOf() - document.lastDayTime;
    if (diff >= ONE_DAY) {
        document.days += Math.floor(diff / ONE_DAY);
        document.lastDayTime = now.setHours(0, 0, 0, 0);
        document.markModified('days lastDayTime');
    }

    if (!document.messages) document.messages = {};
    if (!document.messages[document.days]) document.messages[document.days] = { total: 0 };

    const dayData = document.messages[document.days];
    dayData.total += 1;
    dayData[message.channelId] = (dayData[message.channelId] || 0) + 1;
    document.markModified('messages');

    const reference = message.reference ? (await message.fetchReference()).author : undefined;
    const friends = [...message.mentions.users.values(), reference].filter(
        (u) => u && !u.bot && u.id !== message.author.id,
    );
    if (friends.length) {
        if (!document.chatFriends) document.chatFriends = {};
        for (const friend of friends) {
            if (document.chatFriends[friend.id]) document.chatFriends[friend.id] += 1;
            else document.chatFriends[friend.id] = 1;
        }
        document.markModified('chatFriends');
    }

    if (!messageCooldowns.has(message.author.id)) {
        messageCooldowns.set(message.author.id, now.getTime());
        document.messageXP += StatManager.getXP(!!message.member.premiumSince);

        if (document.messageXP >= StatManager.getRequiredXP(document.messageLevel)) {
            document.messageLevel += 1;
            document.messageXP = Math.abs(document.messageXP - StatManager.getRequiredXP(document.messageLevel));
            document.markModified('messageLevel');

            const newRole = message.guild.roles.cache.get(
                client.config.SERVER.MESSAGE_LEVEL_ROLES[document.messageLevel],
            );
            if (newRole && !message.member.roles.cache.has(newRole.id)) {
                const allRoles = Object.values(client.config.SERVER.MESSAGE_LEVEL_ROLES);
                if (allRoles.some((r) => message.member.roles.cache.has(r)))
                    await message.member.roles.remove(allRoles);
                await message.member.roles.add(newRole);
            }

            const logChannel = message.member.guild.channels.cache.find((c) => c.name === 'level-log') as TextChannel;
            if (logChannel) {
                logChannel.send({
                    content: `${message.member}, ${bold('mesaj')} seviyen doldu ve yeni leveline atladın! (${inlineCode(
                        `Yeni Seviye: ${document.messageLevel}`,
                    )}) `,
                });
            }
        }

        document.markModified('messageXP');
    }

    await document.save();
}

export default statHandler;

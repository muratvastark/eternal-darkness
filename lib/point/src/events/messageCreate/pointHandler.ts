import { StaffModel } from '@/models';
import { Client } from '@/base';
import { Message } from 'discord.js';
import { StaffManager } from '@/managers';

export default async function pointHandler(client: Client, message: Message) {
    if (message.channelId !== client.config.SERVER.CHAT_CHANNEL || !StaffManager.checkStaff(message.member)) return;

    const point = message.member.roles.cache.has(client.config.SERVER.CHAT_ADMIN_ROLE)
        ? client.config.SERVER.CHAT_ADMIN_POINT
        : client.config.SERVER.CHAT_POINT;

    const document = await StaffModel.findOneAndUpdate(
        { id: message.author.id },
        {
            $inc: { totalPoints: point, messagePoints: point, allPoints: point },
            $set: { lastMessage: Date.now() },
        },
        { upsert: true, new: true },
    );

    await StaffManager.checkTasks({
        document,
        count: 1,
        spesificType: 'MESSAGE',
    });
    await StaffManager.checkRole(message.member, document);

    document.save();
}

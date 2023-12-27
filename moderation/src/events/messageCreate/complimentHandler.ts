import { COMPLIMENTS } from '@/assets';
import { Client } from '@/base';
import { Message } from 'discord.js';

let complimentCounter = 0;

async function complimentHandler(client: Client, message: Message) {
    if (
        message.author.bot ||
        !message.guildId ||
        client.config.BOT.PREFIXES.some((prefix) => message.content.startsWith(prefix)) ||
        message.content.length < 5 ||
        client.config.SERVER.CHAT_CHANNEL !== message.channelId
    )
        return;

    complimentCounter++;
    if (complimentCounter !== 500) return;
    complimentCounter = 0;

    message.reply(COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
}

export default complimentHandler;

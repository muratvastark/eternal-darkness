import { ICommand } from '@/types';
import { codeBlock, inlineCode } from 'discord.js';

const BanList: ICommand = {
    usages: ['ban-list', 'banlist', 'banliste', 'ban-liste'],
    description: 'Sunucudan yasaklanmış kişilerin tam listesini görürsünüz.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713'],
    execute: async ({ client, message }) => {
        const bans = await message.guild.bans.fetch();

        const text = bans
            .map((ban) => `${ban.user} (${inlineCode(ban.user.id)}): ${ban.reason || 'Sebep belirtilmemiş.'}`)
            .join('\n');
        const [firstContent, ...arr] = client.utils.splitMessage(text, { maxLength: 2000, char: '\n' });
        message.channel.send({
            content: [
                codeBlock(
                    `Sunucumuzda toplam ${bans.size} yasaklı kullanıcı bulunmakta. Kişilerin ban nedenlerini öğrenmek icin ${client.config.BOT.PREFIXES[0]}banbilgi <id> komutunu kullanabilirsin.`,
                ),
                firstContent,
            ].join('\n'),
        });
        for (const newText of arr) message.channel.send({ content: newText });
    },
};

export default BanList;

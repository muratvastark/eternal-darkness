import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, bold } from 'discord.js';

const Warn: ICommand = {
    usages: ['warn', 'uyarı', 'uyarıver'],
    description: 'Uyarı verir.',
    usableAuth: [
        '1179030512573091930',
        '1179403561747095552',
        '1179554144130969713',
        '1179554128347803669',
        '1179554153362628669',
    ],
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await MemberManager.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (MemberManager.checkUser(client, message, member)) return;

        const reason = args.slice(reference ? 0 : 1).join(' ') || 'Sebep belirtilmemiş.';

        await UserModel.updateOne(
            { id: member.id },
            { $push: { warns: { timestamp: Date.now(), reason, admin: message.author.id } } },
            { upsert: true },
        );

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} adlı kullanıcıya ${bold(reason)} sebebiyle uyarı verildi.`,
                }),
            ],
        });
    },
};

export default Warn;

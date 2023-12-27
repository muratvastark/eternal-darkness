import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, time } from 'discord.js';

const Warns: ICommand = {
    usages: ['warns', 'uyarılar'],
    description: 'Kullanıcının uyarılarına bakar.',
    usableAuth: [
        '1179030512573091930',
        '1179403561747095552',
        '1179554144130969713',
        '1179554128347803669',
        '1179554153362628669',
    ],
    async execute({ client, message, args }) {
        const member = await MemberManager.getMember(message.guild, args[0]);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        const document = await UserModel.findOne({ id: member.id });
        if (!document || !document.warns.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} adlı kullanıcının uyarıları: ${document.warns.length}.\n${document.warns
                        .map((w) => `${time(Math.floor(w.timestamp / 1000), 'R')} - ${w.reason} - ${w.admin}`)
                        .join('\n')}`,
                }),
            ],
        });
    },
};

export default Warns;

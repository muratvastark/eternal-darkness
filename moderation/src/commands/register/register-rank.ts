import { RegisterFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, bold, italic } from 'discord.js';

const RegisterRank: ICommand = {
    usages: ['register-rank'],
    description: 'Register rank command',
    usableAuth: [
        '1179885310323208242',
        '1179568339580891176',
        '1179030512573091930',
        '1179403561747095552',
        '1179554144130969713',
    ],
    execute: async ({ client, message, args }) => {
        const member = args.length
            ? (await MemberManager.getMember(message.guild, args[0])) ||
              (message.reference ? (await message.fetchReference()).member : undefined)
            : message.member;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        const document = await UserModel.findOne({ id: member.id });
        if (!document) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: message.author.username,
                        iconURL: message.author.displayAvatarURL({ forceStatic: true }),
                    },
                    description: `${member} adlı kullanıcının kayıt ettiği kullanıcı sayısı: ${
                        document.registers.length
                    } ${bold('toplam')} (${
                        document.registers.filter((r) => r.type === RegisterFlags.Woman).length
                    } ${italic('kadın')}, ${
                        document.registers.filter((r) => r.type === RegisterFlags.Man).length
                    } ${italic('erkek')}).`,
                }),
            ],
        });
    },
};

export default RegisterRank;

import { UserModel } from '@/models';
import { MemberManager, StatManager } from '@/managers';
import { PermissionFlagsBits, bold, inlineCode } from 'discord.js';
import { ICommand } from '@/types';

const RemoveVoiceXP: ICommand = {
    usages: ['sesxpçıkar'],
    description: 'Bir kullanıcının ses seviyesini çıkarır.',
    execute: async ({ client, message, args }) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const user = await MemberManager.getUser(client, args[0]);
        if (!user) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt.');
        if (user.bot) return client.utils.sendTimedMessage(message, 'Botların verisi bulunamaz.');

        let xp = parseInt(args[1]);
        if (!xp || 0 > xp) return client.utils.sendTimedMessage(message, 'Geçerli bir sayı belirt!');

        message.channel.send(
            `${user} adlı kullanıcıdan ${inlineCode(xp.toString())} adet ${bold('ses')} seviyesi çıkarıldı.`,
        );

        const document = (await UserModel.findOne({ id: user.id })) || new UserModel({ id: user.id });
        for (; xp > 0; ) {
            document.voiceXP -= xp;
            if (document.voiceXP >= 0) break;

            xp = Math.abs(document.voiceXP);
            document.voiceLevel--;

            const currentRequiredXP = StatManager.getRequiredXP(document.voiceLevel);
            document.voiceXP = currentRequiredXP;

            if (0 > document.voiceLevel) {
                document.voiceLevel = 1;
                document.voiceXP = 0;
                break;
            }
        }

        await document.save();
    },
};

export default RemoveVoiceXP;

import { UserModel } from '@/models';
import { MemberManager, StatManager } from '@/managers';
import { PermissionFlagsBits, bold, inlineCode } from 'discord.js';
import { ICommand } from '@/types';

const RemoveMessageXP: ICommand = {
    usages: ['mesajxpçıkar'],
    description: 'Bir kullanıcının mesaj seviyesini çıkarır.',
    execute: async ({ client, message, args }) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const user = await MemberManager.getUser(client, args[0]);
        if (!user) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt.');
        if (user.bot) return client.utils.sendTimedMessage(message, 'Botların verisi bulunamaz.');

        let xp = parseInt(args[1]);
        if (!xp || 0 > xp) return client.utils.sendTimedMessage(message, 'Geçerli bir sayı belirt!');

        message.channel.send(
            `${user} adlı kullanıcıdan ${inlineCode(xp.toString())} adet ${bold('mesaj')} seviyesi çıkarıldı.`,
        );

        const document = (await UserModel.findOne({ id: user.id })) || new UserModel({ id: user.id });
        for (; xp > 0; ) {
            document.messageXP -= xp;
            if (document.messageXP >= 0) break;

            xp = Math.abs(document.messageXP);
            document.messageLevel--;

            const currentRequiredXP = StatManager.getRequiredXP(document.messageLevel);
            document.messageXP = currentRequiredXP;

            if (0 > document.messageLevel) {
                document.messageLevel = 1;
                document.messageXP = 0;
                break;
            }
        }

        await document.save();
    },
};

export default RemoveMessageXP;

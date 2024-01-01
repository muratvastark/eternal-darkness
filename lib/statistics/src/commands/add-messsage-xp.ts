import { UserModel } from '@/models';
import { MemberManager, StatManager } from '@/managers';
import { PermissionFlagsBits, bold, inlineCode } from 'discord.js';
import { ICommand } from '@/types';

const AddMessageXP: ICommand = {
    usages: ['mesajxpekle'],
    description: 'Mesaj seviyesini arttırmanıza yardımcı olur.',
    execute: async ({ client, message, args }) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const user = await MemberManager.getUser(client, args[0]);
        if (!user) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt.');
        if (user.bot) return client.utils.sendTimedMessage(message, 'Botların verisi bulunamaz.');

        const xp = parseInt(args[1]);
        if (!xp || 0 > xp) return client.utils.sendTimedMessage(message, 'Geçerli bir sayı belirt!');

        message.channel.send(
            `${user} adlı kullanıcıya ${inlineCode(xp.toString())} adet ${bold('mesaj')} seviyesi eklendi.`,
        );

        const document = (await UserModel.findOne({ id: user.id })) || new UserModel({ id: user.id });
        document.messageXP += xp;
        for (; document.messageXP >= StatManager.getRequiredXP(document.messageLevel); document.messageLevel++) {
            document.messageXP -= StatManager.getRequiredXP(document.messageLevel);
        }

        await document.save();
    },
};

export default AddMessageXP;

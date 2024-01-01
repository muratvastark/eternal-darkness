import { UserModel } from '@/models';
import { MemberManager, StatManager } from '@/managers';
import { PermissionFlagsBits, bold, inlineCode } from 'discord.js';
import { ICommand } from '@/types';

const AddVoiceXP: ICommand = {
    usages: ['sesxpekle'],
    description: 'Ses puanı eklemenize yardımcı olur.',
    execute: async ({ client, message, args }) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const user = await MemberManager.getUser(client, args[0]);
        if (!user) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt.');
        if (user.bot) return client.utils.sendTimedMessage(message, 'Botların verisi bulunamaz.');

        const xp = parseInt(args[1]);
        if (!xp || 0 > xp) return client.utils.sendTimedMessage(message, 'Geçerli bir sayı belirt!');

        message.channel.send(
            `${user} adlı kullanıcıya ${inlineCode(xp.toString())} adet ${bold('ses')} seviyesi eklendi.`,
        );

        const document = (await UserModel.findOne({ id: user.id })) || new UserModel({ id: user.id });
        document.voiceXP += xp;
        for (; document.voiceXP >= StatManager.getRequiredXP(document.voiceLevel); document.voiceLevel++) {
            document.voiceXP -= StatManager.getRequiredXP(document.voiceLevel);
        }

        await document.save();
    },
};

export default AddVoiceXP;

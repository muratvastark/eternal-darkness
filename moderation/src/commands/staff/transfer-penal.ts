import { MemberManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const TransferPenal: ICommand = {
    usages: ['sicilaktar', 'cezaaktar', 'penaltransfer'],
    description: 'Hesap değişmiş yada yanlış ceza uygulanmış kullanıcının cezalarını başka bir kullanıcıya aktarır.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713', '1179554128347803669'],
    execute: async ({ client, message, args }) => {
        const user = await MemberManager.getUser(client, args[0]);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const transferUser = await MemberManager.getUser(client, args[1]);
        if (!transferUser) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        await PenalModel.updateMany({ user: user.id }, { $set: { user: transferUser.id } });

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    description: `${user} adlı kullanıcının cezaları ${transferUser} adlı kullanıcıya aktarıldı.`,
                }),
            ],
        });
    },
};

export default TransferPenal;

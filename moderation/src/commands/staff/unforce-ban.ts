import { PenalFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { PenalModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const UnForceban: ICommand = {
    usages: ['unyargı', 'yargıkaldır', 'açılmazbanaç', 'açılmaz-banaç', 'açılmazban-aç', 'açılmaz-ban-aç'],
    description: 'Banını kaldıralamaz olarak işaretlediğiniz kullanıcının işaretini kaldırırsınız.',
    usableAuth: ['1179403561747095552'],
    execute: async ({ client, message, args }) => {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

        const reference = message.reference ? (await message.fetchReference()).author : undefined;
        const user = (await MemberManager.getUser(client, args[0])) || reference;
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }
        message.guild.members.unban(user.id);
        await PenalModel.updateMany(
            { activity: true, user: user.id, type: PenalFlags.ForceBan },
            { $set: { activity: false, remover: message.author.id, removeTime: Date.now() } },
        );

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${user} kullanıcısının başarıyla cezası kaldırıldı.`,
                }),
            ],
        });
    },
};

export default UnForceban;

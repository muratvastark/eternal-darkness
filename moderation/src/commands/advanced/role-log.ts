import { RoleLogFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import {
    ButtonInteraction,
    ComponentType,
    EmbedBuilder,
    bold,
    codeBlock,
    roleMention,
    time,
    userMention,
} from 'discord.js';

const types = {
    [RoleLogFlags.Add]: 'Ekleme (Komut)',
    [RoleLogFlags.AddAdmin]: 'Ekleme (Sağ Tık)',
    [RoleLogFlags.Remove]: 'Çıkarma (Komut)',
    [RoleLogFlags.RemoveAdmin]: 'Çıkarma (Sağ Tık)',
};

const RoleLog: ICommand = {
    usages: ['rollog', 'rol-log', 'rl', 'rlog'],
    description: 'Belirttiğiniz üyenin tüm rol log verilerini görüntülersiniz.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179566325199282177'],
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const document = await UserModel.findOne({ id: user.id });
        if (!document || !document.roleLogs.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmamaktadır.');
            return;
        }

        let page = 1;
        const totalData = Math.ceil(document.roleLogs.length / 5);
        const mappedDatas = document.roleLogs.map(
            (d) =>
                `${d.admin ? userMention(d.admin) : 'Bulunamadı.'} (${bold(types[d.type])} | ${time(
                    Math.floor(d.time / 1000),
                    'R',
                )}): ${d.roles.map((r) => roleMention(r)).join(', ')}`,
        );

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: mappedDatas.slice(0, 10).join('\n'),
            footer: {
                text: `${document.roleLogs.length} adet rol güncellemesi bulunuyor.`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: document.roleLogs.length > 10 ? [client.utils.paginationButtons(page, totalData)] : [],
        });

        if (10 >= document.roleLogs.length) return;

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i: ButtonInteraction) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            question.edit({
                embeds: [
                    embed.setDescription(mappedDatas.slice(page === 1 ? 0 : page * 10 - 10, page * 10).join('\n')),
                ],
                components: [client.utils.paginationButtons(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default RoleLog;

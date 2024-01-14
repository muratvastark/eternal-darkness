import { RoleLogFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { StaffExcuseModel, UserModel } from '@/models';
import { ICommand } from '@/types';
import {
    ButtonInteraction,
    ComponentType,
    EmbedBuilder,
    bold,
    codeBlock,
    inlineCode,
    time,
    userMention,
} from 'discord.js';

const Excuses: ICommand = {
    usages: ['excuses', 'mazeretler'],
    description: 'Belirttiğiniz üyenin tüm rol log verilerini görüntülersiniz.',
    usableAuth: [],
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const documents = await StaffExcuseModel.find({ staffId: user.id });
        if (!documents.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmamaktadır.');
            return;
        }

        let page = 1;
        const totalData = Math.ceil(documents.length / 5);
        const mappedDatas = documents.map(
            (d) => [
                `Mazeret Ekleyen Yetkili: ${userMention(d.adminId)} (${inlineCode(d.adminId)})`,
                `Mazeret Başlangıç: ${time(Math.floor(d.createdTimestamp / 1000), "f")} (${time(Math.floor(d.createdTimestamp / 1000), "R")})`,
                `Mazeret Bitiş: ${time(Math.floor(d.finishTimestamp / 1000), "f")} (${time(Math.floor(d.finishTimestamp / 1000), "R")})`,
                `Mazeret Sebebi: ${d.reason}`
            ].join("\n")
        );

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: mappedDatas.slice(0, 10).join('\n\n'),
            footer: {
                text: `${documents.length} adet mazeret bilgisi bulunuyor.`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: documents.length > 5 ? [client.utils.paginationButtons(page, totalData)] : [],
        });

        if (5 > documents.length) return;

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
                    embed.setDescription(mappedDatas.slice(page === 1 ? 0 : page * 10 - 10, page * 10).join('\n}n')),
                ],
                components: [client.utils.paginationButtons(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default Excuses;

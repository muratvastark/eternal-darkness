import { NameFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import { ButtonInteraction, ComponentType, EmbedBuilder, codeBlock } from 'discord.js';

const titles = {
    [NameFlags.Man]: 'Kayıt Olma (Erkek)',
    [NameFlags.Woman]: 'Kayıt Olma (Kız)',
    [NameFlags.ChangeName]: 'İsim Değiştirme (Yetkili)',
    [NameFlags.Booster]: 'İsim Değiştirme (Boost)',
    [NameFlags.AutoRegister]: 'Oto Kayıt',
};

const Names: ICommand = {
    usages: ['isimler'],
    description: 'Belirtilen kullanıcının geçmiş isimlerini görüntülersiniz.',
    usableAuth: ['1179554150351122432', '1179030512573091930', '1179403561747095552'],
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        const document = await UserModel.findOne({ id: user.id });
        if (!document || !document.names.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        }

        let page = 1;
        const totalData = Math.ceil(document.names.length / 10);
        const mappedDatas = document.names.map((n) => {
            const user = client.users.cache.get(n.admin);
            return codeBlock(
                'fix',
                [
                    `İşlem: ${titles[n.type]}`,
                    `İsim: ${n.name}`,
                    n.admin || n.admin !== user.id
                        ? user
                            ? `Yetkili: ${user.username} (${user.id})`
                            : `Yetkili: ${n.admin}`
                        : undefined,
                    `Tarih: ${new Date(n.timestamp).toLocaleString('tr-TR', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                    })}`,
                ]
                    .filter(Boolean)
                    .join('\n'),
            );
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: mappedDatas.slice(0, 5).join(''),
            footer: {
                text: `${document.names.length} adet isim kayıdı bulunuyor.`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: document.names.length > 5 ? [client.utils.paginationButtons(page, totalData)] : [],
        });

        if (5 > document.names.length) return;

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
                embeds: [embed.setDescription(mappedDatas.slice(page === 1 ? 0 : page * 5 - 5, page * 5).join(''))],
                components: [client.utils.paginationButtons(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default Names;

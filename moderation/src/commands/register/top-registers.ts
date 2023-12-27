import { RegisterFlags } from '@/enums';
import { UserModel } from '@/models';
import { Client } from '@/base';
import { EmbedBuilder, ComponentType, ButtonInteraction, Message, codeBlock } from 'discord.js';
import { ICommand, IRegister } from '@/types';
import { MemberManager } from '@/managers';

const TopRegister: ICommand = {
    usages: [
        'top-register',
        'topteyit',
        'top-teyit',
        'topt',
        'top-registers',
        'topregister',
        'topregisters',
        'tregister',
        'toprank',
    ],
    description: 'Sunucu kayıt top listesini görüntülersiniz.',
    usableAuth: [
        '1179885310323208242',
        '1179568339580891176',
        '1179030512573091930',
        '1179403561747095552',
        '1179554144130969713',
        '1179554128347803669',
        '1179554153362628669',
    ],
    execute: async ({ client, message }) => {
        const datas = await UserModel.find({
            $expr: { $gt: [{ $size: '$registers' }, 0] },
        }).lean();
        if (!datas.length)
            return client.utils.sendTimedMessage(
                message,
                'sunucuda kayıt yapan adam yok kayıt yapan adam alın oçlar..',
            );

        const mappedDatas = datas
            .map((d) => ({
                id: d.id,
                man: d.registers.filter((r) => r.type === RegisterFlags.Man).length,
                woman: d.registers.filter((r) => r.type === RegisterFlags.Woman).length,
            }))
            .sort((a, b) => b.man + b.woman - (a.man + a.woman));
        const totalData = Math.ceil(datas.length / 10);

        const userRank = mappedDatas.findIndex((m) => m.id === message.author.id) + 1;
        const userData = (datas.find((m) => m.id === message.author.id) || { registers: [] }).registers;

        let page = 1;
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: await createContent(client, message, userData, userRank, mappedDatas, page),
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: [client.utils.paginationButtons(page, totalData)],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            i.deferUpdate();

            if (i.customId === 'first') page = 1;
            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;
            if (i.customId === 'last') page = totalData;

            await question.edit({
                embeds: [
                    embed.setDescription(
                        await createContent(
                            client,
                            message,
                            userData,
                            userRank,
                            mappedDatas.slice(page === 1 ? 0 : page * 10 - 10, page * 10),
                            page,
                        ),
                    ),
                ],
                components: [client.utils.paginationButtons(page, totalData)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default TopRegister;

async function createContent(
    client: Client,
    message: Message,
    userData: IRegister[],
    userRank: number,
    datas: { id: string; man: number; woman: number }[],
    page: number,
) {
    let content = [
        `< ${message.guild.name} Sunucusunun Kayıt Sıralaması >`,
        `> Senin sıralaman: ${userRank === 0 ? 'henüz kayıdın bulunmuyor' : userRank}`,
        `> ${' '.repeat(6)} ${userData.filter((t) => t.type === RegisterFlags.Man).length} erkek, ${
            userData.filter((t) => t.type === RegisterFlags.Woman).length
        } kadın, ${
            userData.filter((t) => t.type === RegisterFlags.Man).length +
            userData.filter((t) => t.type === RegisterFlags.Woman).length
        } toplam\n`,
    ];
    for (let i = 0; datas.length > i; i++) {
        const data = datas[i];

        let name = '';
        let user = await MemberManager.getUser(client, data.id);
        if (!user) name = 'Silinmiş Hesap';
        else name = `@${user.displayName.replace('discord.gg', '**').replace('.gg/', '**')}`;

        content.push(
            `# ${i + (page - 1) * 10 + 1} ${name}`,
            `${' '.repeat(8)} ${data.man} erkek, ${data.woman} kadın, ${data.man + data.woman} toplam`,
        );
    }

    return codeBlock(
        'md',
        [
            ...content,
            new Date().toLocaleString('tr-TR', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
            }),
        ].join('\n'),
    );
}

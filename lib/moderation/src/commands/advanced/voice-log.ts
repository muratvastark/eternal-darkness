import { VoiceFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import {
    ButtonInteraction,
    ComponentType,
    EmbedBuilder,
    TextChannel,
    hyperlink,
    inlineCode,
    messageLink,
    time,
} from 'discord.js';

const types = {
    [VoiceFlags.Join]: '🟢',
    [VoiceFlags.Leave]: '🔴',
    [VoiceFlags.AdminMove]: '🟡',
    [VoiceFlags.AdminDisconnect]: '🟠',
    [VoiceFlags.Camera]: '📸',
    [VoiceFlags.Stream]: '📺',
};

const VoiceLog: ICommand = {
    usages: ['voicelog', 'voice-log', 'vl', 'vlog'],
    description: 'Belirttiğiniz üyenin tüm ses log verilerini görüntülersiniz.',
    usableAuth: [
        '1179568355343089765',
        '1179566358434939032',
        '1179554144130969713',
        '1179554128347803669',
        '1179403561747095552',
        '1179030512573091930',
    ],
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
        const totalData = Math.ceil(document.voiceLogs.length / 10);
        const logChannel = message.guild.channels.cache.find((c) => c.name === 'voice-log') as TextChannel;
        const mappedDatas = document.voiceLogs.map((d) => {
            const user = client.users.cache.get(d.admin);
            const channel = message.guild.channels.cache.get(d.channelId) || { name: 'deleted-channel' };
            return `${types[d.type]} ${user ? `${inlineCode(`@${user.tag} - ${user.id}`)}` : ``} ${
                channel.name
            } (${time(Math.floor(d.timestamp / 1000), 'R')}) [ ${hyperlink(
                '?',
                messageLink(logChannel.id, d.messageId),
            )} ]`;
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: mappedDatas.slice(0, 10).join('\n'),
            footer: {
                text: `${document.roleLogs.length} adet ses güncellemesi bulunuyor.`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: document.roleLogs.length > 10 ? [client.utils.paginationButtons(page, totalData)] : [],
        });

        if (10 >= document.voiceLogs.length) return;

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

export default VoiceLog;

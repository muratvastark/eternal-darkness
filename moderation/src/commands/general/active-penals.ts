import { PenalModel } from '@/models';
import { Client } from '@/base';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    bold,
    inlineCode,
    userMention,
} from 'discord.js';
import { MemberManager, PenalManager } from '@/managers';
import { ICommand, IPenal } from '@/types';
import { PenalFlags } from '@/enums';

const types = {
    [PenalFlags.Underworld]: 'Sunucudan Yasaklanma',
    [PenalFlags.ChatMute]: 'Sohbet Mutesi',
    [PenalFlags.VoiceMute]: 'Ses Mutesi',
    [PenalFlags.Quarantine]: 'Cezalı',
    [PenalFlags.ForceBan]: 'Kalıcı Ban',
};

const ActivePenals: ICommand = {
    usages: ['aktifceza', 'aktifcezalar', 'mb', 'cb', 'db'],
    description: 'Kullanıcının aktif ceza(ları) varsa görüntülersiniz.',
    execute: async ({ client, message, args }) => {
        const user = args[0]
            ? await MemberManager.getUser(client, args[0])
            : message.reference
              ? (await message.fetchReference()).author
              : message.author;
        if (!user || user.bot) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const activePenals = await PenalModel.find({
            user: user.id,
            activity: true,
            visible: true,
        });
        if (!activePenals.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        }

        const firstPenal = activePenals[0];
        const embed = new EmbedBuilder({ color: client.utils.getRandomColor() });
        let page = 1;

        const question = await message.channel.send({
            embeds: [createContent(client, firstPenal, embed)],
            components: activePenals.length > 1 ? [client.utils.paginationButtons(page, activePenals.length)] : [],
        });

        if (1 > activePenals.length) return;

        const filter = (i) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
        });
        const timeFinished = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'timefinished',
                    label: 'Mesajın Geçerlilik Süresi Doldu.',
                    emoji: { name: '⏱️' },
                    style: ButtonStyle.Danger,
                    disabled: true,
                }),
            ],
        });

        collector.on('collect', async (i: ButtonInteraction) => {
            const penal = activePenals[page - 1];

            i.deferUpdate();
            if (i.customId === 'first') page = 1;
            if (i.customId === 'last') page = activePenals.length;
            if (i.customId === 'next') page++;
            if (i.customId === 'back') page--;

            question.edit({
                embeds: [createContent(client, penal, embed)],
                components: [client.utils.paginationButtons(page, activePenals.length)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                question.edit({ components: [timeFinished] });
            }
        });
    },
};

export default ActivePenals;

function createContent(client: Client, penal: IPenal, embed: EmbedBuilder) {
    const image = PenalManager.getImage(penal.reason);
    const replacedReason = penal.reason.replace(PenalManager.reasonImage, '');
    embed
        .setImage(image ? image : undefined)
        .setTitle(types[penal.type])
        .setDescription(
            [
                `${inlineCode('>')} ${bold('Cezalandırılan Yetkili:')} ${userMention(penal.admin)} (${inlineCode(
                    penal.admin,
                )})`,
                `${inlineCode('>')} ${bold('Ceza Sebebi:')} ${replacedReason || 'Sebep belirtilmemiş.'}`,
                `${inlineCode('>')} ${bold('Ceza Süresi:')} ${client.utils.numberToString(
                    penal.finishTimestamp - penal.createdTimestamp,
                )}`,
                `${inlineCode('>')} ${bold('Ceza Kalan Süre:')} ${client.utils.numberToString(
                    penal.finishTimestamp - Date.now(),
                )}`,
            ]
                .filter(Boolean)
                .join('\n'),
        );
    return embed;
}

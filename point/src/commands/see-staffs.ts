import { MemberManager } from '@/managers';
import { StaffModel } from '@/models';
import { StaffManager } from '@/managers';
import { ButtonInteraction, ComponentType, EmbedBuilder, bold, inlineCode, time, userMention } from 'discord.js';
import { ICommand } from '@/types';

const SeeStaffs: ICommand = {
    usages: ['yetkililerim', 'yetkililer', 'ytlerim', 'ytler'],
    description: 'Yetkili verilerinizi gösterir.',
    execute: async ({ client, message, args }) => {
        let member = message.member;
        const newArgs = args.join(' ').trim();
        if (newArgs.length) member = await MemberManager.getMember(message.guild, newArgs);

        if (!member) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        if (member.user.bot) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı bir bot!');
        if (!StaffManager.checkStaff(member)) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı yetkili değil!');
            return;
        }

        const document = await StaffModel.findOne({ id: member.id });
        if (!document || !document.staffTakes.length) {
            client.utils.sendTimedMessage(
                message,
                member.id === message.author.id
                    ? 'Yetkili verin bulunmuyor.'
                    : 'Belirttiğin kullanıcının yetkili verisi bulunmuyor.',
            );
            return;
        }

        let page = 1;
        const totalPages = Math.ceil(document.staffTakes.length / 10);
        const mappedPages = document.staffTakes.map(
            (t, i) =>
                `${bold((i + 1).toString())}. ${time(Math.floor(t.timestamp / 1000), 'f')}: ${userMention(
                    t.id,
                )} (${inlineCode(t.id)})`,
        );
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: [
                `${member} adlı yetkilinin yetkiye başlattığı kullanıcı bilgileri;`,
                mappedPages.slice(0, 10).join('\n'),
            ].join('\n'),
            footer: {
                text: `${document.staffTakes.length} yetkili.`,
            },
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: document.staffTakes.length > 5 ? [client.utils.paginationButtons(page, totalPages)] : [],
        });

        if (10 >= document.staffTakes.length) return;

        const filter = (i: ButtonInteraction) =>
            i.user.id === message.author.id && i.isButton() && ['previous', 'next'].includes(i.customId);
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i: ButtonInteraction) => {
            i.deferUpdate();

            if (i.customId === 'previous') page -= 1;
            if (i.customId === 'next') page += 1;

            question.edit({
                embeds: [embed.setDescription(mappedPages.slice(page === 1 ? 0 : page * 10 - 10, page * 10).join(''))],
                components: [client.utils.paginationButtons(page, totalPages)],
            });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default SeeStaffs;

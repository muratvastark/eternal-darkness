import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import {
    ActionRowBuilder,
    StringSelectMenuInteraction,
    ComponentType,
    StringSelectMenuBuilder,
    bold,
} from 'discord.js';

const DeleteWarn: ICommand = {
    usages: ['deletewarn', 'uyarısil'],
    description: 'Belirtilen kullanıcının belirtilen uyarını siler.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713'],
    execute: async ({ client, message, args }) => {
        const member = await MemberManager.getMember(message.guild, args[0]);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (MemberManager.checkUser(client, message, member)) return;

        const document = await UserModel.findOne({ id: member.id });
        if (!document || !document.warns.length) {
            client.utils.sendTimedMessage(message, 'Kullanıcının verisi bulunmuyor.');
            return;
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'delete-warn',
                    options: document.warns.map((w, i) => ({
                        label: w.reason,
                        value: i.toString(),
                    })),
                }),
            ],
        });

        const question = await message.channel.send({
            content: 'Sileceğiniz uyarıyı seçin.',
            components: [row],
        });

        const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.StringSelect,
        });

        collector.on('collect', (i: StringSelectMenuInteraction) => {
            const warn = document.warns[parseInt(i.values[0])];
            document.warns = document.warns.filter((w) => w.timestamp !== warn.timestamp);
            document.save();

            i.reply({
                content: `${bold(warn.reason)} sebepli uyarı silindi.`,
                ephemeral: true,
            });
        });

        collector.on('end', (_, reason) => {
            question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default DeleteWarn;

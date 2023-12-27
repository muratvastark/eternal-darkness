import { ICommand } from '@/types';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const SendStaffTakeButton: ICommand = {
    usages: ['sstb'],
    description: 'özel',
    execute: ({ client, message }) => {
        if (!client.config.BOT.BOT_OWNERS.includes(message.author.id)) return;

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'appeal-staff',
                    label: 'Başvuru Yap',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        message.channel.send({
            content:
                'Yetkili başvurularınızı burada bekliyoruz! Sunucumuza katkıda bulunmak ve ekibimize katılmak için lütfen aşağıdaki butona basıp formu doldurun. İyi şanslar!',
            components: [row],
        });
    },
};

export default SendStaffTakeButton;

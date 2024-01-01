import { ICommand } from '@/types';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, codeBlock } from 'discord.js';

const CheckSuspect: ICommand = {
    usages: ['suspectcontrol'],
    description: 'Şüpheli kontrol mesajını attırırsınız.',
    execute: async ({ client, message }) => {
        if (!client.config.BOT.BOT_OWNERS.includes(message.author.id)) return;

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'suspect-control',
                    label: 'Doğrula',
                    style: ButtonStyle.Secondary,
                    emoji: '1154785498959728660',
                }),
            ],
        });

        message.channel.send({
            content: `${codeBlock(
                'fix',
                `Merhaba;
Sunucumuz 7 gün içinde kurulan hesapları hiçbir şekilde kabul etmemektedir. Lütfen "Cezalıdan çıkarır mısın?" ya da "Şüpheli hesap kaldırır mısın?" yazmayın.

Eğer hesabının kurulma süresinden en az 7 gün geçtiğini düşünüyorsan ve hala buradaysan sunucudan çıkıp tekrardan girmeyi veya aşağıdaki butona tıklayarak tekrar kayıt olabilirsin, iyi günler.

${message.guild.name}
`,
            )}`,
            components: [row],
        });
    },
};

export default CheckSuspect;

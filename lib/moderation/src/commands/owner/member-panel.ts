import { ICommand } from '@/types';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Team } from 'discord.js';

const MemberPanel: ICommand = {
    usages: ['kullanıcı-panel', 'kullanıcıpanel'],
    description: 'Kullanıcı panel mesajını attırırsınız.',
    execute: async ({ client, message }) => {
        if (!client.config.BOT.BOT_OWNERS.includes(message.author.id)) return;

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'memberJoinedServer',
                    label: '1️⃣',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'historyName',
                    label: '2️⃣',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'activePenalties',
                    label: '3️⃣',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'historyPenalties',
                    label: '4️⃣',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });
        const row2 = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'penaltiesNumber',
                    label: '5️⃣',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'memberRoles',
                    label: '6️⃣',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'createdAt',
                    label: '7️⃣',
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    custom_id: 'booster',
                    label: '8️⃣',
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        message.channel.send({
            content: `
Aşağıdaki menüden kendinize bir işlem seçip sunucu içi depolanan verilerinizi sorgulayabilirsiniz. Verileriniz sadece sizin görebileceğiniz şekilde gönderilir.
• 1: Sunucuya giriş tarihinizi öğrenin.
• 2: Kayıt olmuş olduğunuz isimleri öğrenin.
• 3: Devam eden cezanız (varsa) hakkında bilgi alın.
• 4: Geçmiş cezalarınızı öğrenin.

• 5: Ceza sayınız öğrenin.
• 6: Üzerinizdeki rolleri sıralayın.
• 7: Hesabınızın açılış tarihini öğrenin.
• 8: İsim değiştirme (Sadece booster.).
`,
            components: [row, row2],
        });
    },
};

export default MemberPanel;

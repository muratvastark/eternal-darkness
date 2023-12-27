import { GiveawayModel } from '@/models';
import { ActionRowBuilder, ButtonBuilder, ButtonComponentData, ButtonInteraction, ComponentType } from 'discord.js';

export async function giveawayJoin(interaction: ButtonInteraction) {
    const document = await GiveawayModel.findOneAndUpdate(
        { messageId: interaction.message.id },
        { $addToSet: { joiners: interaction.user.id } },
    );
    if (!document) {
        interaction.reply({
            content: 'Bu çekiliş silinmiş!',
            ephemeral: true,
        });
        return;
    }

    if (document.joiners.includes(interaction.user.id)) {
        interaction.reply({
            content: 'Çekilişe zaten katıldın!',
            ephemeral: true,
        });
        return;
    }

    document.joiners.push(interaction.user.id);

    interaction.reply({
        content: 'Çekilişe katıldın!',
        ephemeral: true,
    });

    const giveawayButtonRow = new ActionRowBuilder<ButtonBuilder>({
        components: [
            new ButtonBuilder(interaction.message.components[0].components[0].data as ButtonComponentData).setLabel(
                document.joiners.length.toString(),
            ),
        ],
    });

    const messageEmbed = interaction.message.embeds[0].data;
    await interaction.message.edit({
        components: [giveawayButtonRow],
        embeds: [
            {
                ...messageEmbed,
                description: `${messageEmbed.description.split('\n').slice(0, 3).join("\n")}\n\nKatılımcı Sayısı: ${
                    document.joiners.length
                }\nSon Katılan Üye: ${interaction.user}`,
            },
        ],
    });
}

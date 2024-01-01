import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, TextChannel, formatEmoji, userMention } from "discord.js";

async function appealAccept(interaction: ButtonInteraction) {
    interaction.deferUpdate();

    interaction.message.edit({
        components: [
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        custom_id: "taked",
                        style: ButtonStyle.Danger,
                        label: interaction.user.displayName,
                        disabled: true
                    })
                ]
            })
        ]
    });

    const channel = interaction.guild.channels.cache.get("1180721013110100018") as TextChannel;
    if (!channel) return;

    channel.send({
        content: `${formatEmoji("1182043959019712643", true)} ${userMention(interaction.customId.split("-")[2])}, başvurunuz onaylandı. Yetkili alım bekleme odasına geçerek yetkinizi alabilirsiniz.`
    });
}

export default appealAccept;

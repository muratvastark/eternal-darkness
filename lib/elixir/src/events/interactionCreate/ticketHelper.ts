import { Client } from '@/base';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    CategoryChannel,
    ChannelType,
    EmbedBuilder,
    OverwriteType,
    PermissionFlagsBits,
    bold,
    inlineCode,
    roleMention,
} from 'discord.js';

export async function ticketHelper(client: Client, interaction: ButtonInteraction) {
    const ticketCategory = client.channels.cache.get(client.config.SERVER.TICKET_CATEGORY) as CategoryChannel;
    if (!ticketCategory) return;

    const hasTicket = ticketCategory.children.cache.find((c) => c.name.includes(interaction.user.id));
    if (hasTicket) {
        interaction.reply({
            content: `${hasTicket} adında destek talebiniz mevcut.`,
            ephemeral: true,
        });
        return;
    }

    const authRoles =
        interaction.customId === 'problem-resolve-ticket'
            ? client.config.SERVER.PROBLEM_RESOLVE_TICKET_ROLES
            : client.config.SERVER.NORMAL_TICKET_ROLES;
    const ticketChannel = await interaction.guild.channels.create({
        name: `${interaction.customId === 'problem-resolve-ticket' ? 'sc' : 'normal'}-${interaction.user.id}`,
        parent: client.config.SERVER.TICKET_CATEGORY,
        type: ChannelType.GuildText,
        permissionOverwrites: [
            {
                id: interaction.guildId,
                type: OverwriteType.Role,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: interaction.user.id,
                type: OverwriteType.Member,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                ],
            },
            ...authRoles.map((r) => ({
                id: r,
                type: OverwriteType.Role,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                ],
            })),
        ],
    });

    ticketChannel.send({
        content: `${authRoles.map((r) => roleMention(r)).join(' ')} | ${interaction.user}`,
        embeds: [
            new EmbedBuilder({
                title: 'Destek talebi oluşturuldu!',
                description: `${interaction.user} (${inlineCode(interaction.user.id)}) tarafından ${bold(
                    interaction.customId === 'problem-resolve-ticket' ? 'sorun çözme' : 'normal',
                )} talebi oluşturuldu.`,
                timestamp: Date.now(),
            }),
        ],
        components: [
            new ActionRowBuilder<ButtonBuilder>({
                components: [
                    new ButtonBuilder({
                        customId: 'ticket-close',
                        emoji: { name: '🔒' },
                        label: 'Talebi Kapat',
                        style: ButtonStyle.Danger,
                    }),
                ],
            }),
        ],
    });

    interaction.reply({
        content: `${ticketChannel} adlı kanala destek talebiniz oluşturuldu.`,
        ephemeral: true,
    });
}

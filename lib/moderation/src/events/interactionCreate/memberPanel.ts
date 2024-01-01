import { MemberManager, MemberPanelManager } from '@/managers';
import { Client } from '@/base';
import { ButtonInteraction, time } from 'discord.js';

async function memberPanel(client: Client, interaction: ButtonInteraction) {
    const interactionMember = await MemberManager.getMember(interaction.guild,interaction.user.id);
    if (!interactionMember) return;

    if (interaction.customId === 'memberJoinedServer' && !MemberPanelManager.checkLimit(interaction)) {
        interaction.reply({
            content: `Sunucuya katılma tarihiniz: ${time(Math.floor(interactionMember.joinedTimestamp / 1000))} (${time(
                Math.floor(interactionMember.joinedTimestamp / 1000),
                'R',
            )})`,
            ephemeral: true,
        });
    }

    if (interaction.customId === 'historyName' && !MemberPanelManager.checkLimit(interaction)) {
        MemberPanelManager.historyNames(client, interactionMember, interaction);
    }

    if (interaction.customId === 'activePenalties' && !MemberPanelManager.checkLimit(interaction)) {
        MemberPanelManager.activePenals(client, interactionMember, interaction);
    }

    if (interaction.customId === 'historyPenalties' && !MemberPanelManager.checkLimit(interaction)) {
        MemberPanelManager.historyPenals(client, interactionMember, interaction);
    }

    if (interaction.customId === 'penaltiesNumber' && !MemberPanelManager.checkLimit(interaction)) {
        MemberPanelManager.punishPoints(client, interactionMember, interaction);
    }

    if (interaction.customId === 'memberRoles' && !MemberPanelManager.checkLimit(interaction)) {
        MemberPanelManager.memberRoles(client, interactionMember, interaction);
    }

    if (interaction.customId === 'createdAt' && !MemberPanelManager.checkLimit(interaction)) {
        interaction.reply({
            content: `Hesap oluşturma tarihiniz: ${time(
                Math.floor(interactionMember.user.createdTimestamp / 1000),
            )} (${time(Math.floor(interactionMember.user.createdTimestamp / 1000), 'R')})`,
            ephemeral: true,
        });
    }

    if (
        interaction.customId === 'booster' &&
        interactionMember.premiumSince &&
        !MemberPanelManager.checkLimit(interaction)
    ) {
        MemberPanelManager.booster(client, interactionMember, interaction);
    }
}

export default memberPanel;

import { Client } from '@/base';
import { ButtonInteraction, roleMention, StringSelectMenuInteraction } from 'discord.js';
import config from '../../../config.json';

const allRoles = {
    'color-roles': config.SERVER.COLOR_ROLES,
    'game-roles': config.SERVER.GAME_ROLES,
    'love-roles': config.SERVER.LOVE_ROLES,
    'zodiac-roles': config.SERVER.ZODIAC_ROLES,
    'team-roles': config.SERVER.TEAM_ROLES
};

async function roleSelect(client: Client, interaction: ButtonInteraction | StringSelectMenuInteraction) {
    const interactionMember = interaction.guild.members.cache.get(interaction.user.id);
    if (!interactionMember) return;

    if (interaction.isStringSelectMenu() && interaction.values[0] === "trash-relation") {
        const memberRoles = interactionMember.roles.cache.filter((role) => config.SERVER.LOVE_ROLES.includes(role.id));
        if (!memberRoles.size) {
            interaction.reply({
                content: "Üzerinizde rol bulunmuyor.",
                ephemeral: true
            });
            return;
        }

        await interactionMember.roles.remove(memberRoles);

        interaction.reply({
            content: "Üzerinizden rol alındı.",
            ephemeral: true
        });

        return;
    }

    if (interaction.isStringSelectMenu() && interaction.values[0] === "trash-team") {
        const memberRoles = interactionMember.roles.cache.filter((role) => config.SERVER.TEAM_ROLES.includes(role.id));
        if (!memberRoles.size) {
            interaction.reply({
                content: "Üzerinizde rol bulunmuyor.",
                ephemeral: true
            });
            return;
        }

        await interactionMember.roles.remove(memberRoles);

        interaction.reply({
            content: "Üzerinizden rol alındı.",
            ephemeral: true
        });

        return;
    }

    if (interaction.isStringSelectMenu() && interaction.values[0] === "trash-game") {
        const memberRoles = interactionMember.roles.cache.filter((role) => config.SERVER.GAME_ROLES.includes(role.id));
        if (!memberRoles.size) {
            interaction.reply({
                content: "Üzerinizde rol bulunmuyor.",
                ephemeral: true
            });
            return;
        }

        await interactionMember.roles.remove(memberRoles);

        interaction.reply({
            content: `Üzerinizden ${memberRoles.size > 1 ? "roller" : "rol"} alındı.`,
            ephemeral: true
        });

        return;
    }


    if (interaction.isStringSelectMenu() && interaction.values[0] === "trash-color") {
        const memberRoles = interactionMember.roles.cache.filter((role) => config.SERVER.COLOR_ROLES.includes(role.id));
        if (!memberRoles.size) {
            interaction.reply({
                content: "Üzerinizde rol bulunmuyor.",
                ephemeral: true
            });
            return;
        }

        await interactionMember.roles.remove(memberRoles);

        interaction.reply({
            content: "Üzerinizden rol alındı.",
            ephemeral: true
        });

        return;
    }

    if (interaction.isButton() && ['giveaway-role', 'event-role'].includes(interaction.customId)) {
        const role =
            interaction.customId === 'giveaway-role'
                ? client.config.SERVER.GIVEAWAY_ROLE
                : client.config.SERVER.EVENT_ROLE;
        if (interactionMember.roles.cache.has(role)) {
            await interactionMember.roles.remove(role);
            interaction.reply({
                content: `${roleMention(role)} rolü üzerinizden alındı.`,
                ephemeral: true,
            });
        } else await interactionMember.roles.add(role);
        interaction.reply({
            content: `${roleMention(role)} rolü üzerinize verildi.`,
            ephemeral: true,
        });
    }

    if (
        ['color-roles', 'game-roles', 'love-roles', 'zodiac-roles', 'team-roles'].includes(interaction.customId) &&
        interaction.isStringSelectMenu()
    ) {
        if ((!interactionMember.premiumSince && !client.config.BOT.BOT_OWNERS.includes(interactionMember.id)) && interaction.customId === 'color-roles')
            return interaction.reply({
                content: 'Bu roller sadece  booster özeldir.',
                ephemeral: true,
            });

            let texts: string[] = [];
            for (const v of interaction.values) {
                if (interaction.customId !== "game-roles") {
                    const roles = allRoles[interaction.customId];
                    await interactionMember.roles.set(interactionMember.roles.cache.filter((role) => !roles.includes(role.id)));    
                }
                console.log(interaction.guild.roles.cache.get(interaction.values[0]).name)
                await interactionMember.roles.add(interaction.values[0]);
                texts.push(`${roleMention(v)} rolü üzerinize verildi.`);
            }

            interaction.reply({
                content: texts.join("\n"),
                ephemeral: true,
            });   
    }
}

export default roleSelect;

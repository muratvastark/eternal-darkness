import { IEvent } from '@/types';
import {
    AttachmentBuilder,
    Events,
    FetchMessagesOptions,
    PermissionFlagsBits,
    Snowflake,
    TextChannel,
} from 'discord.js';
import specialRooms from './specialRooms';
import { ticketHelper } from './ticketHelper';
import { MemberManager } from '@/managers';
import modalSubmit from './modalSubmit';

const InteractionCreate: IEvent<Events.InteractionCreate> = {
    name: Events.InteractionCreate,
    execute: async (client, interaction) => {
        if (interaction.isButton() && ['sr-add-user', 'sr-remove-user'].includes(interaction.customId))
            specialRooms(interaction);
        if (interaction.isModalSubmit() && ['sr-add-user', 'sr-remove-user'].includes(interaction.customId)) await modalSubmit(interaction);
        if (interaction.isButton() && ['problem-resolve-ticket', 'normal-ticket'].includes(interaction.customId))
            ticketHelper(client, interaction);
        if (interaction.isButton() && interaction.customId === 'ticket-close') {
            const authRoles = interaction.channel.name.startsWith('sc')
                ? client.config.SERVER.PROBLEM_RESOLVE_TICKET_ROLES
                : client.config.SERVER.NORMAL_TICKET_ROLES;
            const member = await MemberManager.getMember(interaction.guild, interaction.user.id);
            if (
                !authRoles.some((r) => member.roles.cache.has(r)) &&
                !member.permissions.has(PermissionFlagsBits.Administrator)
            ) {
                interaction.reply({
                    content: 'Odayı sadece yetkililer kapatabilir.',
                    ephemeral: true,
                });
                return;
            }

            const texts = [];
            const fetchOptions: FetchMessagesOptions = { limit: 100 };
            let lastMessageId: Snowflake;
            let fetchComplete: boolean = false;
            while (!fetchComplete) {
                if (lastMessageId) fetchOptions.before = lastMessageId;

                const fetched = await interaction.channel.messages.fetch(fetchOptions);
                if (fetched.size === 0) {
                    fetchComplete = true;
                    break;
                }

                lastMessageId = fetched.last().id;

                fetched.forEach((m) => {
                    const date = new Date(m.createdTimestamp).toLocaleString();

                    texts.push(
                        `${date} - ${m.author.displayName}: ${m.content ? m.cleanContent : 'Mesaj yok.'} ${m.attachments.size > 0 ? m.attachments.first().proxyURL : ''
                        }`,
                    );
                });
            }

            const logChannel = interaction.guild.channels.cache.get(
                client.config.SERVER.TICKET_LOG_CHANNEL,
            ) as TextChannel;
            if (logChannel) {
                logChannel.send({
                    files: [
                        new AttachmentBuilder(Buffer.from(texts.reverse().join('\n')), {
                            name: `${interaction.channel.name}.txt`,
                        }),
                    ],
                });
            }

            interaction.channel.delete();
        }
    },
};

export default InteractionCreate;

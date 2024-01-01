import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ModalBuilder,
    OverwriteType,
    PermissionFlagsBits,
    TextInputBuilder,
    TextInputStyle,
    VoiceChannel,
    bold,
    channelMention,
    inlineCode,
    userMention,
} from 'discord.js';
import { Client } from '@/base';
import { MemberManager } from '@/managers';
import { StreamModel } from '@/models';

const inviteRegex = new RegExp(/discord(?:app.com\/invite|.gg|.me|.io)(?:[\\]+)?\/([a-zA-Z0-9\-]+)/, 'gi');

async function streamOwner(client: Client, interaction: ButtonInteraction) {
    const member = await MemberManager.getMember(interaction.guild, interaction.user.id);
    if (!member) return;

    if (
        !member.permissions.has(PermissionFlagsBits.Administrator) &&
        !member.roles.cache.has(client.config.SERVER.STREAM_ROLE)
    )
        return;

    if (!member.voice.channelId) {
        interaction.reply({
            content: 'Seste yoksun.',
            ephemeral: true,
        });
        return;
    }

    const channel = member.voice.channel as VoiceChannel;
    const hasAnotherOwner = client.streams.find((os) => os.channelId === channel.id);
    const owneredChannel = client.streams.find(
        ({ channelId, ownerId }) => channelId === channel.id && ownerId === interaction.user.id,
    );

    if (interaction.customId === "streamer-owner") {
        if (channel.parentId !== client.config.SERVER.STREAM_CATEGORY) {
            interaction.reply({
                content: 'Stream kanalında bulunman gerekiyor.',
                ephemeral: true,
            });
            return;
        }

        if (owneredChannel) {
            interaction.reply({
                content: `Halihazırda ${channelMention(owneredChannel.channelId)} odasının sahibisiniz.`,
                ephemeral: true,
            });
            return;
        }

        if (hasAnotherOwner && hasAnotherOwner.ownerId !== interaction.user.id) {
            interaction.reply({
                content: `${userMention(hasAnotherOwner.ownerId)} (${inlineCode(
                    hasAnotherOwner.ownerId,
                )}) adlı kullanıcı odanın sahibi.`,
                ephemeral: true,
            });
            return;
        } 

        client.streams.push({
            channelId: channel.id,
            ownerId: interaction.user.id,
        });

        await StreamModel.create({
            id: channel.id,
            name: channel.name,
            permissions: channel.permissionOverwrites.cache.map((c) => ({
                id: c.id,
                allow: c.allow.bitfield.toString(),
                deny: c.deny.bitfield.toString(),
            })),
            ownerId: interaction.user.id,
        });

        channel.permissionOverwrites.cache.forEach(p => p.edit({ MuteMembers: false }));
        channel.permissionOverwrites.create(interaction.user.id, { MuteMembers: true });

        interaction.reply({
            content: `${channel} adlı odanın sahibi artık sizsiniz`,
            ephemeral: true
        });

        return;
    }

    if (interaction.customId === 'streamer-owner-change') {
        if (!owneredChannel) {
            interaction.reply({
                content: 'Odanın sahibi sen değilsin.',
                ephemeral: true,
            });
            return;
        }

        const userId = new ActionRowBuilder<TextInputBuilder>({
            components: [
                new TextInputBuilder({
                    custom_id: 'user-id',
                    label: "Kullanıcı ID'si",
                    placeholder: '470974660264067072',
                    style: TextInputStyle.Short,
                    required: true,
                }),
            ],
        });

        const modal = new ModalBuilder({ custom_id: 'modal', title: 'Odayı Aktarma', components: [userId] });

        await interaction.showModal(modal);

        const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 2 });
        if (modalCollected) {
            const targetMember = await MemberManager.getMember(
                interaction.guild,
                modalCollected.fields.getTextInputValue('user-id'),
            );
            if (!targetMember) {
                modalCollected.reply({
                    content: "Belirttiğin kullanıcı ID'si geçerli değil.",
                    ephemeral: true,
                });
                return;
            }

            if (
                !targetMember.permissions.has(PermissionFlagsBits.Administrator) &&
                !targetMember.roles.cache.has(client.config.SERVER.STREAM_ROLE)
            ) {
                modalCollected.reply({
                    content: 'Belirttiğin kişi yetkili değil.',
                    ephemeral: true,
                });
                return;
            }

            hasAnotherOwner.ownerId = targetMember.id;
            await StreamModel.updateOne({ id: channel.id }, { $set: { ownerId: targetMember.id } });

            channel.permissionOverwrites.cache.forEach(p => p.edit({ MuteMembers: false }));
            channel.permissionOverwrites.create(targetMember.id, { MuteMembers: true });

            modalCollected.reply({
                content: `${targetMember} (${inlineCode(targetMember.id)}) adlı yetkiliye oda aktarıldı.`,
                ephemeral: true,
            });
        }
    }
}

export default streamOwner;

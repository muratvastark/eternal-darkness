import { MemberManager } from "@/managers";
import { ModalSubmitInteraction, OverwriteType } from "discord.js";

export default async function modalSubmit(interaction: ModalSubmitInteraction) {
    if (interaction.customId === 'sr-add-user') {
        const member = await MemberManager.getMember(
            interaction.guild,
            interaction.fields.getTextInputValue('user'),
        );

        const interactionMember = await MemberManager.getMember(
            interaction.guild,
            interaction.user.id,
        );

        const channel = interactionMember.voice.channel;
        if (!channel) {
            interaction.reply({
                content: 'Önce kendi odanı oluşturman gerekiyor.',
                ephemeral: true,
            });
            return;
        }

        if (!channel.name.startsWith('Special Room')) {
            interaction.reply({
                content: 'Öncelikle kendine özel oda oluşturmalısın!',
                ephemeral: true,
            });
            return;
        }

        if (channel.permissionOverwrites.cache.has(member.id)) {
            interaction.reply({
                content: 'Kullanıcı odada izine sahip.',
                ephemeral: true,
            });
            return;
        }

        channel.permissionOverwrites.create(member.id, {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            Stream: true,
            DeafenMembers: true,
            MuteMembers: true,
            MoveMembers: true,
        });

        channel.setUserLimit(
            channel.permissionOverwrites.cache.filter((overwrite) => overwrite.type !== OverwriteType.Role).size +
            1,
        );
        interaction.reply({
            content: 'Başarıyla eklendi.',
            ephemeral: true,
        });
    }

    if (interaction.customId === 'sr-remove-user') {
        const member = await MemberManager.getMember(
            interaction.guild,
            interaction.fields.getTextInputValue('user'),
        );

        const interactionMember = await MemberManager.getMember(
            interaction.guild,
            interaction.user.id,
        );

        const channel = interactionMember.voice.channel;
        if (!channel) {
            interaction.reply({
                content: 'Önce kendi odanı oluşturman gerekiyor.',
                ephemeral: true,
            });
            return;
        }

        if (!channel.name.startsWith('Special Room')) {
            interaction.reply({
                content: 'Öncelikle kendine özel oda oluşturmalısın!',
                ephemeral: true,
            });
            return;
        }

        if (member.voice.channelId && member.voice.channelId === member.voice.channelId) member.voice.disconnect();
        channel.permissionOverwrites.delete(member.id);

        channel.setUserLimit(
            channel.permissionOverwrites.cache.filter((overwrite) => overwrite.type !== OverwriteType.Role).size +
            1,
        );
        interaction.reply({
            content: 'Başarıyla kaldırıldı.',
            ephemeral: true,
        });

    }
}
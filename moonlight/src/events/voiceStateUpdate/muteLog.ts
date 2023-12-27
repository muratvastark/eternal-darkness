import { AuditLogEvent, Colors, EmbedBuilder, TextChannel, VoiceState, bold, inlineCode, time } from 'discord.js';

async function muteLog(state: VoiceState) {
    const now = Date.now();
    const entry = await state.guild
        .fetchAuditLogs({ type: AuditLogEvent.MemberUpdate })
        .then((audit) => audit.entries.first());
    if (now - entry.createdTimestamp > 5000 || !entry.executor || entry.executor.bot || entry.targetId !== state.id)
        return;

    const channel = state.guild.channels.cache.find((c) => c.name === 'voice-log') as TextChannel;

    channel.send({
        embeds: [
            new EmbedBuilder({
                color: Colors.Green,
                author: {
                    name: state.member.user.displayName,
                    icon_url: state.member.user.displayAvatarURL(),
                },
                description: `${state.member} (${inlineCode(state.id)}) adlı kullanıcı ${entry.executor} (${inlineCode(
                    entry.executor.id,
                )}) tarafından ${state.channel} kanalında mikrofonu kapatıldı.\nEylem gerçekleşme: ${time(
                    Math.floor(Date.now() / 1000),
                    'R',
                )}`,
            }),
        ],
    });
}

export default muteLog;

import { VoiceFlags } from '@/enums';
import { UserModel } from '@/models';
import { Colors, EmbedBuilder, TextChannel, VoiceState, bold, inlineCode, time } from 'discord.js';

async function streamLog(state: VoiceState) {
    const channel = state.guild.channels.cache.find((c) => c.name === 'voice-log') as TextChannel;
    const now = Date.now();

    const message = await channel.send({
        embeds: [
            new EmbedBuilder({
                color: Colors.Green,
                author: {
                    name: state.member.user.displayName,
                    icon_url: state.member.user.displayAvatarURL(),
                },
                description: [
                    `${state.member} üyesi ${state.channel} kanalında yayın açtı.\n`,
                    `${bold('Yayın Açtığı Anda:')}`,
                    `Mikrofonu: ${bold(state.mute ? 'Kapalı' : 'Açık')}`,
                    `Kulaklığı: ${bold(state.deaf ? 'Kapalı' : 'Açık')}\n`,
                    `Kanal: ${inlineCode(` ${state.channel.name} (${state.channel.id}) `)}`,
                    `Kullanıcı: ${inlineCode(` ${state.member.user.displayName} (${state.id}) `)}`,
                    `Eylem Gerçekleşme: ${time(Math.floor(Date.now() / 1000), 'R')}\n`,
                    `${bold('Kanalda Bulunan Üyeler:')}`,
                    25 > state.channel.members.size
                        ? state.channel.members
                              .map((m) => `${inlineCode(m.displayName)} [${m.user.displayName}]`)
                              .join('\n')
                        : 'Üye yok!',
                ].join('\n'),
            }),
        ],
    });

    await UserModel.updateOne(
        { id: state.id },
        {
            $push: {
                voiceLogs: {
                    type: VoiceFlags.Stream,
                    timestamp: now,
                    channelId: state.channelId,
                    messageId: message.id,
                },
            },
        },
        { upsert: true },
    );
}

export default streamLog;

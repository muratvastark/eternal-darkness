import { Guild, TextChannel, channelMention } from 'discord.js';
import { schedule } from 'node-cron';

export function voteMessage(guild: Guild) {
    schedule('0 0 * * * *', async () => {
        const channel = guild.channels.cache.find(c => c.name === "eternal-chat") as TextChannel;
        if (!channel) return;

        channel.send({
            content: [
                "## Merhaba Eternal Darkness Üyeleri!",
                `Oylarınızla topluluğumuzu büyütelim! ${channelMention("1179875422826152088")} kanalında oy ver, arkadaşlarını davet et. Birlikte daha güçlü ve büyük bir topluluk oluşturalım!`
            ].join("\n")
        });
    });
}

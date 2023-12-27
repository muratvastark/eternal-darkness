import { GuildMember, TextChannel } from "discord.js";

const channels = ["1183473677694681218"]

export default function mentionChannel(member: GuildMember) {
    channels.forEach(id => {
        const channel = member.guild.channels.cache.get(id) as TextChannel;
        if (channel) channel.send(member.toString()).then(msg => setTimeout(() => msg.delete(), 2000));
    })
}

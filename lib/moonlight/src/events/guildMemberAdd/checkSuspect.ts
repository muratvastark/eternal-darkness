import { Client } from '@/base';
import { MemberManager } from '@/managers';
import { Colors, GuildMember, TextChannel, EmbedBuilder, inlineCode } from 'discord.js';

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

function checkSuspect(client: Client, member: GuildMember) {
    if (Date.now() - member.user.createdTimestamp > SEVEN_DAYS) return false;

    MemberManager.setRoles(member, client.config.SERVER.SUSPECT_ROLE);

    const registerChannel = member.guild.channels.cache.get(client.config.SERVER.REGISTER_CHANNEL) as TextChannel;
    if (registerChannel) {
        registerChannel.send({
            embeds: [
                new EmbedBuilder({
                    color: Colors.Red,
                    description: `${member} (${inlineCode(
                        member.id,
                    )}) adlı kullanıcının hesabı 7 günden az bir sürede açıldığı için şüpheliye atıldı.`,
                }),
            ],
        });
    }

    const suspectChannel = member.guild.channels.cache.find((c) => c.name === 'suspect-channel') as TextChannel;
    if (suspectChannel) {
        suspectChannel.send({
            embeds: [
                new EmbedBuilder({
                    color: Colors.Red,
                    description: `${member} (${inlineCode(
                        member.id,
                    )}) adlı kullanıcının hesabı 7 günün ardından şüpheliye atıldı.`,
                }),
            ],
        });
    }

    return true;
}

export default checkSuspect;

import { NameFlags } from '@/enums';
import { UserModel } from '@/models';
import { Client } from '@/base';
import { EmbedBuilder, GuildMember, TextChannel, VoiceChannel, bold, inlineCode, time } from 'discord.js';

async function welcomeHandler(client: Client, member: GuildMember) {
    const embed = new EmbedBuilder({ color: client.utils.getRandomColor() });
    const registerChannel = member.guild.channels.cache.get(client.config.SERVER.REGISTER_CHANNEL) as TextChannel;

    if (client.config.SERVER.AUTO_REGISTER) {
        const document = await UserModel.findOne({ id: member.id });
        const names = document ? document.names.filter((n) => [NameFlags.Man, NameFlags.Woman].includes(n.type)) : [];
        if (names.length) {
            const lastData = names[names.length - 1];
            if (!lastData || !lastData.name) return;

            await member.setNickname(lastData.name);

            const roles = [
                ...client.config.SERVER[lastData.type === NameFlags.Man ? 'MAN_ROLES' : 'WOMAN_ROLES'],
            ];
            if (member.user.displayName.includes(client.config.SERVER.TAG) && client.config.SERVER.TAGGED_SERVER)
                roles.push(client.config.SERVER.FAMILY_ROLE);
            await member.roles.add([...new Set(roles)]);

            document.names.push({
                admin: client.user.id,
                timestamp: Date.now(),
                type: NameFlags.AutoRegister,
                name: lastData.name,
            });
            document.save();

            if (registerChannel) {
                registerChannel.send({
                    embeds: [
                        embed.setDescription(
                            `${member} (${inlineCode(
                                member.id,
                            )}) adlı kullanıcı önceden kayıtlı olduğu için kayıdı otomatik yapıldı.`,
                        ),
                    ],
                });
            }

            return;
        }
    }

    await member.roles.add(client.config.SERVER.UNREGISTER_ROLE);
    await member.setNickname("∙ İsim | Yaş");

    const voiceChannel = member.guild.channels.cache
        .filter((c) => c.isVoiceBased() && c.parentId === registerChannel.parentId && c.id !== '1182336072093536343')
        .sort((a, b) => (a as VoiceChannel).members.size - (b as VoiceChannel).members.size)
        .first();

    registerChannel.send({
        content: [
            `Merhabalar ${member}, ${bold(member.guild.name)} sunucumuza hoşgeldin. Seninle beraber sunucumuz ${bold(
                member.guild.memberCount.toString(),
            )} üye sayısına ulaştı. 🎉`,
            `Sunucuya erişebilmek için ${voiceChannel} odalarında kayıt olup ismini ve yaşını belirtmen gerekmektedir! kurallar kanalından sunucu kurallarımızı okumayı ihmal etme!`,
            `Hesabın ${bold(
                time(Math.floor(member.user.createdTimestamp / 1000), 'R'),
            )} tarihinde oluşturulmuş. (${bold(time(Math.floor(member.user.createdTimestamp / 1000), 'D'))})`,
        ]
            .filter(Boolean)
            .join('\n\n'),
    });
}

export default welcomeHandler;

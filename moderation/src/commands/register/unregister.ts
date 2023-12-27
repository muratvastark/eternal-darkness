import { LimitFlags } from '@/enums';
import { EmbedBuilder, TextChannel, inlineCode, roleMention } from 'discord.js';
import { MemberManager } from '@/managers';
import { ICommand } from '@/types';

const Unregister: ICommand = {
    usages: ['kayıtsız', 'kayitsiz', 'unreg', 'unregister', 'unregistered'],
    description: 'Belirttiğiniz kullanıcıyı kayıtsıza atarsınız.',
    usableAuth: [
        '1179885310323208242',
        '1179568339580891176',
        '1179030512573091930',
        '1179403561747095552',
        '1179554144130969713',
        '1179554128347803669',
        '1179554153362628669',
    ],
    execute: async ({ client, message, args }) => {
        const limit = MemberManager.checkLimit(message.author.id, LimitFlags.Unregister);
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum kayıtsız limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const member =
            (await MemberManager.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (MemberManager.checkUser(client, message, member)) return;

        MemberManager.setRoles(member, client.config.SERVER.UNREGISTER_ROLE);
        member.setNickname('İsim | Yaş');

        message.reply({
            embeds: [
                embed.setDescription(
                    `${member} (${inlineCode(member.id)}) kullanıcısına ${roleMention(
                        client.config.SERVER.UNREGISTER_ROLE,
                    )} verildi!`,
                ),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === 'unregistered-log') as TextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    embed.setDescription(
                        `${message.author} (${inlineCode(
                            message.author.id,
                        )}) adlı yetkili tarafından ${member} (${inlineCode(
                            member.id,
                        )}) adlı kullanıcı kayıtısıza atıldı.`,
                    ),
                ],
            });
        }
    },
};

export default Unregister;

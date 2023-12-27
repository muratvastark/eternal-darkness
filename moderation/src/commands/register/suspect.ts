import { MemberManager } from '@/managers';
import { ICommand } from '@/types';
import { EmbedBuilder, roleMention } from 'discord.js';

const Suspect: ICommand = {
    usages: ['süpheli', 'şüpheli', 'suphe', 'şüphe'],
    description: 'Belirttiğiniz kullanıcı şüpheli hesapsa şüpheli rolü verir.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713'],
    execute: async ({ client, message, args }) => {
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

        if (!member.roles.cache.has(client.config.SERVER.SUSPECT_ROLE)) {
            client.utils.sendTimedMessage(
                message,
                'Sadece rolü olmayan veya kayıtsız rolü olanlar üzerinde bu komutu deneyebilirsin!',
            );
            return;
        }

        if (Date.now() - member.user.createdTimestamp >= 1000 * 60 * 60 * 24 * 7) {
            client.utils.sendTimedMessage(message, 'Bu kullanıcı şüpheli bir hesap değil!');
            return;
        }

        MemberManager.setRoles(member, client.config.SERVER.SUSPECT_ROLE);

        message.reply({
            embeds: [
                embed.setDescription(
                    `${member} kullanıcısı şüpheli hesap olduğu için ${roleMention(
                        client.config.SERVER.SUSPECT_ROLE,
                    )} verildi!`,
                ),
            ],
        });
    },
};

export default Suspect;

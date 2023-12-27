import { MemberManager } from '@/managers';
import { ICommand } from '@/types';
import { EmbedBuilder, inlineCode } from '@discordjs/builders';
import { bold } from 'discord.js';

const Timeout: ICommand = {
    usages: ['timeout'],
    description: 'Sunucuda kurallara uymayan bir kullanıcıyı 1 saatliğine uzaklaştırır.',
    usableAuth: ['1179554144130969713', '1179030512573091930', '1179403561747095552', '1179554128347803669'],
    execute: async ({ client, message, args }) => {
        const member =
            (await MemberManager.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (
            ![
                client.config.SERVER.PENALS.UNDERWORLD.ROLE,
                client.config.SERVER.PENALS.QUARANTINE.ROLE,
                client.config.SERVER.UNREGISTER_ROLE,
            ].some((role) => member.roles.cache.has(role))
        ) {
            client.utils.sendTimedMessage(message, 'Kayıtsız veya cezalı birini belirt!');
            return;
        }

        const botCommandRole = message.guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        if (member.roles.highest.position >= botCommandRole.position) {
            client.utils.sendTimedMessage(message, 'Yetkililere işlem uygulayamazsın.');
            return;
        }

        member.timeout(1000 * 60 * 60);

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(member.id)}) adlı kullanıcı ${bold(
                        '1 saatliğine',
                    )} uzaklaştırıldı.`,
                    author: {
                        name: message.author.username,
                        icon_url: message.author.displayAvatarURL({ forceStatic: true }),
                    },
                }),
            ],
        });
    },
};

export default Timeout;

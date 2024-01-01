import { StaffModel } from '@/models';
import { MemberManager, StaffManager } from '@/managers';
import { Colors, EmbedBuilder, TextChannel, bold, inlineCode } from 'discord.js';
import { ICommand } from '@/types';

const DownStaff: ICommand = {
    usages: ['yçek', 'yç'],
    description: 'Belirtilen kullanıcının rollerini çeker.',
    usableAuth: ['1179030512573091930', '1179403561747095552'],
    execute: async ({ client, message, args }) => {
        const member = await MemberManager.getMember(message.guild, args[0]);
        if (!member) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        if (member.user.bot) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı bir bot!');
        if (!StaffManager.checkStaff(member)) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı yetkili değil!');
            return;
        }

        const reason = args.slice(1).join(' ');
        if (!reason.length) return client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt!');

        const botCommandRole = message.guild.roles.cache.get(client.config.SERVER.MIN_STAFF_ROLE);
        await member.roles.remove(
            member.roles.cache.filter((r) => r.position >= botCommandRole.position).map((r) => r.id),
        );

        await StaffModel.updateOne(
            { id: member.id },
            { $push: { oldRoles: { timestamp: Date.now(), roles: [] } } },
            { upsert: true },
        );

        const logChannel = message.guild.channels.cache.find((c) => c.name === 'yetkisi-çekilenler') as TextChannel;
        if (logChannel) {
            logChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: Colors.Green,
                        description: `${message.author} (${inlineCode(
                            message.author.id,
                        )}) adlı yetkili ${member} (${inlineCode(member.id)}) adlı yetkilinin yetkisini çekti.`,
                    }),
                ],
            });
        }

        message.channel.send(`${member} adlı yetkilinin ${bold(reason)} sebebinden dolayı yetkisi çekildi.`);
    },
};

export default DownStaff;

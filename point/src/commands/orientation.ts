import { StaffModel } from '@/models';
import { MemberManager, StaffManager } from '@/managers';
import { ICommand } from '@/types';
import { Colors, EmbedBuilder, TextChannel, inlineCode } from 'discord.js';

const Orientation: ICommand = {
    usages: ['oryantasyon'],
    description: 'Belirtilen kullanıcıya oryantasyon verir.',
    usableAuth: ["1179568367150047343"],
    execute: async ({ client, message, args }) => {
        const member = await MemberManager.getMember(message.guild, args[0]);
        if (!member) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        if (member.user.bot) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı bir bot!');

        const minStaffRole = message.guild.roles.cache.get("1179554150351122432");
        if (minStaffRole.position > member.roles.highest.position) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı yetkili değil!');
            return;
        }

        const memberDocument = await StaffModel.findOne({ id: member.id });
        if (memberDocument && memberDocument.hasOrientation) {
            client.utils.sendTimedMessage(message, 'Belirttiğin yetkiliye oryantasyon verilmiş.');
            return;
        }

        if (memberDocument) {
            memberDocument.hasOrientation = true;
            memberDocument.save();
        }

        const document = await StaffModel.findOneAndUpdate(
            { id: message.author.id },
            {
                $inc: {
                    totalPoints: client.config.SERVER.ORIENTATION_POINT,
                    allPoints: client.config.SERVER.ORIENTATION_POINT,
                    orientationPoints: client.config.SERVER.ORIENTATION_POINT,
                },
            },
            { upsert: true, new: true },
        );

        await StaffManager.checkTasks({
            document,
            count: 1,
            spesificType: 'ORIENTATION',
        });

        await StaffManager.checkRole(message.member, document);

        document.save();

        message.channel.send(`${member} adlı yetkiliye oryantasyon verildi.`);

        const orientationLogChannel = message.guild.channels.cache.find((c) => c.name === 'oryantasyon-verildi') as TextChannel;
        if (orientationLogChannel) {
            orientationLogChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: Colors.Green,
                        description: `${message.author} (${inlineCode(
                            message.author.id,
                        )}) adlı yetkili ${member} (${inlineCode(member.id)}) adlı yetkiliye oryantasyon verdi.`,
                    }),
                ],
            });
        }
    },
};

export default Orientation;

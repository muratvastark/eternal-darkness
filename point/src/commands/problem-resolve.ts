import { MemberManager } from '@/managers';
import { StaffModel } from '@/models';
import { StaffManager } from '@/managers';
import { Collection, Colors, EmbedBuilder, TextChannel, bold, inlineCode, time } from 'discord.js';
import { ICommand } from '@/types';

const ONE_HOUR = 1000 * 60 * 60;
const cooldowns = new Collection<string, number>();

setInterval(() => {
    const now = Date.now();
    cooldowns.sweep((v) => 0 > v - now);
}, 1000 * 60);

const ProblemResolve: ICommand = {
    usages: ['sç', 'sorunçöz', 'sorunçözücü'],
    description: 'Kullanıcıların sorunlarını çözer.',
    usableAuth: ["1179568324867268608"],
    execute: async ({ client, message, args }) => {
        const member = await MemberManager.getMember(message.guild, args[0]);
        if (!member) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        if (member.user.bot) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı bir bot!');
        if (StaffManager.checkStaff(member)) {
            client.utils.sendTimedMessage(message, 'Yetkililerin sorununu çözemezsin!');
            return;
        }

        const now = Date.now();
        const cooldown = cooldowns.get(member.id);
        if (cooldown && cooldown > now) {
            client.utils.sendTimedMessage(
                message,
                `Kullanıcıların sorunları saatlik bir tanedir. (${time(Math.floor(cooldown / 1000), 'R')})`,
            );
            return;
        }

        const reason = args.slice(1).join(' ');
        if (!reason) return client.utils.sendTimedMessage(message, 'Çözülen sorunun sebebini belirt!');

        const document = await StaffModel.findOneAndUpdate(
            { id: message.author.id },
            {
                $inc: {
                    totalPoints: client.config.SERVER.PROBLEM_POINT,
                    allPoints: client.config.SERVER.PROBLEM_POINT,
                    problemPoints: client.config.SERVER.PROBLEM_POINT,
                },
            },
            { upsert: true, new: true },
        );

        await StaffManager.checkTasks({
            document,
            count: 1,
            spesificType: 'PROBLEM',
        });

        await StaffManager.checkRole(message.member, document);

        document.save();

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} adlı kullanıcının sorununu çözdüğünü belirttim ve puanını ekledim.`,
                }),
            ],
        });

        const logChannel = message.guild.channels.cache.find((c) => c.name === 'problem-resolve-log') as TextChannel;
        if (logChannel) {
            logChannel.send({
                embeds: [
                    new EmbedBuilder({
                        color: Colors.Green,
                        timestamp: now,
                        description: `${message.member} (${inlineCode(member.id)}) adlı yetkili ${member} (${inlineCode(
                            member.id,
                        )}) adlı kullanıcının ${bold(reason)} adlı sorununu çözdü`,
                    }),
                ],
            });
        }

        cooldowns.set(member.id, now + ONE_HOUR);
    },
};

export default ProblemResolve;

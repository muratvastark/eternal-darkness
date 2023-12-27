import { Client } from '@/base';
import { MemberManager } from '@/managers';
import { StaffManager } from '@/managers';
import { StaffModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, bold, codeBlock, formatEmoji, inlineCode } from 'discord.js';
import ms from 'ms';

const ShowTask: ICommand = {
    usages: ['görevler', 'görev', 'görevbak', 'bakgörev', 'görevlerim'],
    description: 'Görevleri verir.',
    execute: async ({ client, message, args }) => {
        let member = message.member;
        const newArgs = args.join(' ').trim();
        if (newArgs.length) member = await MemberManager.getMember(message.guild, newArgs);

        if (!member) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        if (member.user.bot) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı bir bot!');
        if (!StaffManager.checkStaff(member)) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı yetkili değil!');
            return;
        }

        const { currentRole, newRole } = StaffManager.getRank(member.roles.cache.map((r) => r.id));
        if (!newRole) {
            client.utils.sendTimedMessage(
                message,
                'Son rolde bulunduğundan görevi bulunmuyor. Puan kasılması sayesinde yöneticiler yükseletecektir.',
            );
            return;
        }

        const document = await StaffModel.findOne({ id: member.id });
        if (!document) {
            client.utils.sendTimedMessage(message, 'Yetkili verisi bulunmuyor.');
            return;
        }

        if (!document.tasks.length) {
            client.utils.sendTimedMessage(message, 'Görev bulunmuyor.');
            return;
        }

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: [
                `${member} (${inlineCode(member.id)}) adlı kullanıcının görevleri;`,
                codeBlock(
                    "ansi",
                    `[2;35m${currentRole.MUST_PUBLIC ? 'Public seste durma ve ' : ''}${
                        currentRole.REQUIRED_TASKS
                    } adet görev yapma zorunluğundasın.[0m`,
                ),
                document.tasks
                    .map((t) => {
                        const task = client.config.SERVER.TASKS.find(
                            (tt) => tt.TYPE === t.type && (ms(tt.COUNT as string) === t.requiredCount || tt.COUNT === t.requiredCount),
                        );

                        return `${bold(
                            inlineCode(` ${task.NAME}: `),
                        )} ${createBar(client, t.currentCount, t.requiredCount)} (${inlineCode(
                            `${
                                task.COUNT_TYPE === 'TIME'
                                    ? client.utils.numberToString(t.currentCount)
                                    : t.currentCount
                            } / ${
                                task.COUNT_TYPE === 'TIME'
                                    ? client.utils.numberToString(t.requiredCount)
                                    : t.requiredCount
                            }`,
                        )})`;
                    })
                    .join('\n'),
            ].join('\n'),
        });

        message.channel.send({ embeds: [embed] });
    },
};

export default ShowTask;

function createBar(client: Client, current: number, required: number): string {
    let percentage = (100 * current) / required;
    percentage = percentage > 100 ? 100 : percentage;

    let str = '';
    const progress = Math.round((percentage / 100) * 3);
    str += formatEmoji(percentage > 0 ? client.config.EMOJIS.BAR_START_FILL : client.config.EMOJIS.BAR_START_EMPTY);
    str += formatEmoji(client.config.EMOJIS.BAR_MID_FILL).repeat(progress);
    str += formatEmoji(client.config.EMOJIS.BAR_MID_EMPTY).repeat(3 - progress);
    str += formatEmoji(percentage === 100 ? client.config.EMOJIS.BAR_END_FILL : client.config.EMOJIS.BAR_END_EMPTY);

    return str;
}

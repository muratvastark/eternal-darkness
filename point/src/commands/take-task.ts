import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    inlineCode,
    ButtonInteraction,
    ComponentType,
    GuildMember,
    formatEmoji,
    bold,
    codeBlock,
} from 'discord.js';
import { StaffManager } from '@/managers';
import { ICommand } from '@/types';
import { StaffModel } from '@/models';
import { Client } from '@/base';
import ms from 'ms';

const TakeTask: ICommand = {
    usages: ['göreval', 'algörev', 'agörev', 'görev-al', 'al-görev'],
    description: 'Kendinize uygun görevi seçip alırsınız.',
    execute: async ({ client, message }) => {
        const { currentRole } = StaffManager.getRank(message.member.roles.cache.map((r) => r.id));
        if (!currentRole) {
            client.utils.sendTimedMessage(message, 'Bu sistemi kullanmak için yetki rolüne sahip olmalısın.');
            return;
        }

        if (!currentRole.REQUIRED_TASKS) {
            client.utils.sendTimedMessage(
                message,
                'Görevin bulunmuyor. Puan kasılması sayesinde yetkin yükseletecektir.',
            );
            return;
        }

        let currentData = getTask(client, message.member);
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            description: [
                codeBlock(
                    "ansi",
                    `[2;35m${currentRole.MUST_PUBLIC ? 'Public seste durma ve ' : ''}${
                        currentRole.REQUIRED_TASKS
                    } adet görev yapma zorunluğundasın.[0m`,
                ),
                currentData.content
            ].join('\n'),
        });

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    customId: 'new-task',
                    emoji: {
                        id: '1182425038574596166',
                    },
                    style: ButtonStyle.Secondary,
                }),
                new ButtonBuilder({
                    customId: 'accept',
                    emoji: {
                        id: '1180836155420328016',
                    },
                    style: ButtonStyle.Secondary,
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: [row],
        });

        const filter = (btn: ButtonInteraction) => btn.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 2,
            componentType: ComponentType.Button,
        });

        collector.on('collect', async (btn: ButtonInteraction) => {
            btn.deferUpdate();
            if (btn.customId === 'new-task') {
                currentData = getTask(client, message.member);
                question.edit({
                    embeds: [
                        embed.setDescription(
                            [
                                codeBlock(
                                    "ansi",
                                    `[2;35m${currentRole.MUST_PUBLIC ? 'Public seste durma ve ' : ''}${
                                        currentRole.REQUIRED_TASKS
                                    } adet görev yapma zorunluğundasın.[0m`,
                                ),
                                currentData.content,
                            ].join('\n'),
                        ),
                    ],
                    components: [row],
                });
            } else {
                question.edit({
                    embeds: [
                        embed.setDescription(
                            [
                                codeBlock(
                                    "ansi",
                                    `[2;35mAşağıdaki bulunan ${
                                        currentRole.REQUIRED_TASKS.length > 1 ? 'görevler' : 'görev'
                                    } senindir. İyi eğlenceler![0m`,
                                ),
                                currentData.content,
                            ].join('\n'),
                        ),
                    ],
                    components: [],
                });

                await StaffModel.updateOne(
                    { id: message.author.id },
                    {
                        $set: {
                            tasks: currentData.tasks.map((t) => ({
                                type: t.TYPE,
                                currentCount: 0,
                                requiredCount: t.COUNT_TYPE === 'TIME' ? ms(t.COUNT as string) : t.COUNT,
                                compeleted: false,
                            })),
                        },
                    },
                    { upsert: true },
                );
            }
        });

        collector.on('end', () => {
            question.delete();
        });
    },
};

export default TakeTask;

function getTask(client: Client, member: GuildMember) {
    const messageTasks = client.config.SERVER.TASKS.filter((t) => t.TYPE === 'MESSAGE');
    const pubTasks = client.config.SERVER.TASKS.filter((t) => t.TYPE === 'PUBLIC');
    const afkTasks = client.config.SERVER.TASKS.filter((t) => t.TYPE === 'SLEEP');
    const userTasks = [
        messageTasks[Math.floor(Math.random() * messageTasks.length)],
        pubTasks[Math.floor(Math.random() * pubTasks.length)],
        afkTasks[Math.floor(Math.random() * afkTasks.length)],
    ];

    let tasks = client.config.SERVER.TASKS.filter((t) => {
        if (t.ROLE) return member.roles.cache.has(t.ROLE);
        if (['PUBLIC', 'SLEEP', 'MESSAGE'].includes(t.TYPE)) return false;

        return true;
    });
    for (let i = 0; i < 6; i++) {
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        if (!task) break;

        tasks = tasks.filter((t) => t.TYPE !== task.TYPE);
        userTasks.push(task);
    }

    return {
        tasks: userTasks,
        content: userTasks
            .map(
                (t) =>
                    `${formatEmoji('1180836099866767432', true)} ${bold(inlineCode(` ${t.NAME}: `))} ${
                        t.COUNT_TYPE === 'TIME' ? client.utils.numberToString(ms(t.COUNT as string)) : t.COUNT
                    } ${t.COUNT_TYPE === 'CLASSIC' ? 'adet' : t.TYPE === 'MESSAGE' ? 'mesaj' : ''}`,
            )
            .join('\n'),
    };
}

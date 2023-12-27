import { Collection, GuildChannel, GuildMember, TextChannel, VoiceChannel, roleMention, formatEmoji } from 'discord.js';
import config from '../../config.json';
import { StaffModel } from '@/models';
import { IInvite, IStaffDocument, IVoiceBased } from '@/types';
import ms from 'ms';

const ONE_DAY = 1000 * 60 * 60 * 24;

export class StaffManager {
    static voices = new Collection<string, IVoiceBased>();
    static invites = new Collection<string, IInvite>();

    static shortNumber(num: number) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(2) + 'Mr';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        } else {
            return num.toString();
        }
    }

    static getProgressWidth(completed: number, required: number, maxWidth: number, minWidth: number) {
        const complatedPercentage = (100 * completed) / required;
        if (20 >= complatedPercentage) return minWidth;

        return (complatedPercentage / 100) * maxWidth;
    }

    static checkStaff(member: GuildMember) {
        return config.SERVER.RANKS.some((r) => member.roles.cache.has(r.ID));
    }

    static getRank(staffRoles: string[]) {
        if (!config.SERVER.RANKS.length) return { currentRole: undefined, newRole: undefined };

        const sortedRoles = config.SERVER.RANKS.sort((a, b) => a.POINT - b.POINT);
        const currentIndex = sortedRoles.findIndex((rank) => staffRoles.includes(rank.ID));
        return {
            currentRole: sortedRoles[currentIndex] || undefined,
            currentIndex,
            newRole: sortedRoles[currentIndex + 1] || undefined,
            newIndex: currentIndex + 1,
        };
    }

    static async addVoiceStat(member: GuildMember, channel: VoiceChannel, diff: number) {
        const minutes = Math.max(Math.floor(diff / (1000 * 60)), 1);
        let points = minutes * config.SERVER.OTHER_POINT;
        let key = 'otherPoints';

        if (channel.parentId) {
            const responsibilityChannel = config.SERVER.RESPONSIBILITY_CHANNELS.find(
                (r) =>
                    r.CATEGORY === channel.parentId &&
                    !r.INVALID_CHANNELS.includes(channel.id) &&
                    member.roles.cache.has(r.ROLE),
            );
            if (responsibilityChannel) {
                key = 'responsibilityPoints';
                points = minutes * responsibilityChannel.POINT;
            }

            if (channel.parentId === config.SERVER.PUBLIC_CATEGORY && channel.id !== config.SERVER.SLEEP_ROOM) {
                key = 'publicPoints';
                points = minutes * config.SERVER.PUBLIC_POINT;
            }
        }

        const document = await StaffModel.findOneAndUpdate(
            { id: member.id },
            {
                $inc: { totalPoints: points, [key]: points, allPoints: points },
                $set: { lastVoice: Date.now() },
            },
            { upsert: true, new: true },
        );

        await StaffManager.checkTasks({
            document,
            count: diff,
            channel,
            spesificType: key === 'otherPoints' ? 'SLEEP' : key === 'publicPoints' ? 'PUBLIC' : undefined,
        });
        await StaffManager.checkRole(member, document);

        await document.save().catch(() => undefined);
    }

    static async checkTasks({
        document,
        channel,
        spesificType,
        count,
    }: {
        document: IStaffDocument;
        channel?: GuildChannel;
        count: number;
        spesificType?: string;
    }) {
        let findedTask = spesificType ? { TYPE: spesificType } : undefined;
        if (channel) {
            findedTask = config.SERVER.TASKS.find(
                (t) => t.CATEGORY && t.CATEGORY === channel.parentId && !t.INVALID_CHANNELS.includes(channel.id),
            );
        }

        if (!findedTask) return;

        const task = document.tasks.find((t) => t.type === findedTask.TYPE);
        if (!task || task.compeleted) return;

        task.currentCount += count;
        task.compeleted = task.currentCount >= task.requiredCount;
        document.markModified('tasks');
    }

    static async checkRole(member: GuildMember, document: IStaffDocument) {
        const { currentRole, newRole } = StaffManager.getRank(member.roles.cache.map((r) => r.id));
        if (!currentRole || !newRole) return;

        const maxSleep = currentRole.POINT / 2;
        const sleepPoint = document.otherPoints - maxSleep;
        if (sleepPoint > 0) {
            document.otherPoints = maxSleep;
            document.totalPoints = document.totalPoints - sleepPoint;
            document.allPoints = document.allPoints - sleepPoint;
        }

        if (document.totalPoints >= currentRole.POINT) return;

        const compeletedTasks = document.tasks.filter((t) => t.compeleted).length;
        if (currentRole.REQUIRED_TASKS > compeletedTasks) return;

        const publicTask = document.tasks.find((t) => t.type === 'PUBLIC');
        if (currentRole.MUST_PUBLIC && (!publicTask || !publicTask.compeleted)) return;

        const now = Date.now();
        if (now - document.roleStarted >= ms(currentRole.REQUIRED_DAYS as string) * ONE_DAY) return;

        if (newRole.EXTRA_ROLE && currentRole.EXTRA_ROLE !== newRole.EXTRA_ROLE) {
            await member.roles.add(newRole.EXTRA_ROLE);
            await member.roles.remove(currentRole.EXTRA_ROLE);
        }

        await member.roles.remove(currentRole.ID);
        await member.roles.add(newRole.ID);

        document.oldRoles.push({
            timestamp: now,
            roles: [newRole.ID, newRole.EXTRA_ROLE],
        });
        document.invitedUsers = [];
        document.messagePoints = 0;
        document.totalPoints = 0;
        document.otherPoints = 0;
        document.publicPoints = 0;
        document.responsibilityPoints = 0;
        document.bonusPoints = 0;
        document.roleStarted = now;
        document.registerPoints = 0;
        document.problemResolvePoints = 0;
        document.orientationPoints = 0;
        document.tasks = [];
        document.staffTakes = [];

        const channel = member.guild.channels.cache.find((c) => c.name === 'staff-rank-up') as TextChannel;
        if (channel)
            channel.send(`${member} terfi atladı. (${roleMention(currentRole.ID)} -> ${roleMention(newRole.ID)})`);

        document.markModified(
            [
                'oldRoles',
                'invitedUsers',
                'messagePoints',
                'totalPoints',
                'otherPoints',
                'publicPoints',
                'responsibilityPoints',
                'bonusPoints',
                'roleStarted',
                'registerPoints',
                'problemResolvePoints',
                'orientationPoints',
                'tasks',
                'staffTakes',
            ].join(' '),
        );
    }
}

import { Collection, GuildMember, TextChannel, VoiceChannel, bold, inlineCode } from 'discord.js';
import config from '../../config.json';
import { UserModel } from '@/models';
import { IInvite, IVoiceBased } from '@/types';

const ONE_DAY = 1000 * 60 * 60 * 24;

export class StatManager {
    static streams = new Collection<string, IVoiceBased>();
    static cameras = new Collection<string, IVoiceBased>();
    static voices = new Collection<string, IVoiceBased>();
    static invites = new Collection<string, IInvite>();

    static getRequiredXP(level: number) {
        return 5 * Math.pow(level, 2) + 50 * level + 100;
    }

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

    static getXP(isBooster: boolean) {
        const maxPoint = isBooster ? config.SERVER.BOOSTER_MAX_POINT : config.SERVER.NORMAL_MAX_POINT;
        return Math.floor(Math.random() * maxPoint) + 1;
    }

    static async addVoiceStat(member: GuildMember, channel: VoiceChannel, value: number) {
        const document = (await UserModel.findOne({ id: member.id })) || new UserModel({ id: member.id });

        const now = new Date();
        const diff = now.valueOf() - document.lastDayTime;
        if (diff >= ONE_DAY) {
            document.days += Math.floor(diff / ONE_DAY);
            document.lastDayTime = now.setHours(0, 0, 0, 0);
            document.markModified('days lastDayTime');
        }

        if (member.voice.streaming) {
            if (!document.streams[document.days]) document.streams[document.days] = { total: 0, count: 0, voice: 0 };
            document.streams[document.days].voice += value;
            document.markModified('streams');
        }

        if (member.voice.selfVideo) {
            if (!document.cameras[document.days]) document.cameras[document.days] = { total: 0, count: 0, voice: 0 };
            document.cameras[document.days].voice += value;
            document.markModified('cameras');
        }

        const friends = channel.members.filter((m) => !m.user.bot && m.id !== member.id);
        if (friends.size) {
            if (!document.voiceFriends) document.voiceFriends = {};
            for (const [id] of friends) {
                if (document.voiceFriends[id]) document.voiceFriends[id] += value;
                else document.voiceFriends[id] = value;
            }
            document.markModified('voiceFriends');
        }

        if (!document.voices) document.voices = {};
        if (!document.voices[document.days]) document.voices[document.days] = { total: 0 };

        const dayData = document.voices[document.days];
        dayData.total += value;
        dayData[channel.id] = (dayData[channel.id] || 0) + value;
        document.markModified('voices');

        document.voiceXP += StatManager.getXP(!!member.premiumSince);

        if (document.voiceXP >= StatManager.getRequiredXP(document.voiceLevel)) {
            document.voiceLevel += 1;
            document.voiceXP = Math.abs(document.voiceXP - StatManager.getRequiredXP(document.voiceLevel));
            document.markModified('voiceLevel');

            const newRole = member.guild.roles.cache.get(config.SERVER.VOICE_LEVEL_ROLES[document.voiceLevel]);
            if (newRole && !member.roles.cache.has(newRole.id)) {
                const allRoles = Object.values(config.SERVER.VOICE_LEVEL_ROLES);
                if (allRoles.some((r) => member.roles.cache.has(r))) await member.roles.remove(allRoles);
                await member.roles.add(newRole);
            }

            const logChannel = member.guild.channels.cache.find((c) => c.name === 'level-log') as TextChannel;
            if (logChannel) {
                logChannel.send({
                    content: `${member}, ${bold('ses')} seviyen doldu ve yeni leveline atladın! (${inlineCode(
                        `Yeni Seviye: ${document.voiceLevel}`,
                    )}) `,
                });
            }
        }
        document.markModified('voiceXP');

        await document.save();
    }

    static async addCount(userId: string, type: 'streams' | 'cameras') {
        const document = (await UserModel.findOne({ id: userId })) || new UserModel({ id: userId });
        const now = new Date();
        const diff = now.valueOf() - document.lastDayTime;
        if (diff >= ONE_DAY) {
            document.days += Math.floor(diff / ONE_DAY);
            document.lastDayTime = now.setHours(0, 0, 0, 0);
            document.markModified('days lastDayTime');
        }

        if (!document[type][document.days]) document[type][document.days] = { total: 0, count: 0, voice: 0 };
        document[type][document.days].count += 1;

        document.markModified(type);
        await document.save();
    }

    static async addStat(member: GuildMember, value: number, type: 'streams' | 'cameras') {
        const now = new Date();
        const document = (await UserModel.findOne({ id: member.id })) || new UserModel({ id: member.id });
        const diff = now.valueOf() - document.lastDayTime;
        if (diff >= ONE_DAY) {
            document.days += Math.floor(diff / ONE_DAY);
            document.lastDayTime = now.setHours(0, 0, 0, 0);
            document.markModified('days lastDayTime');
        }

        if (!document[type][document.days]) document[type][document.days] = { total: 0, count: 0, voice: 0 };
        document[type][document.days].total += value;

        document.markModified(type);
        await document.save();
    }
}

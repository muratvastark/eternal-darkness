import { Client } from '@/base';
import { ILimit } from '@/types';
import { Collection, Guild, GuildMember, Message, PermissionFlagsBits, User, time } from 'discord.js';

export class MemberManager {
    static limits = new Collection<string, ILimit>();

    static checkLimit(id: string, type: number, count: number = 5, minutes: number = 1000 * 60 * 15) {
        const key = `${id}-${type}`;
        const now = Date.now();

        const userLimits = MemberManager.limits.get(`${id}-${type}`);
        if (!userLimits) {
            MemberManager.limits.set(key, { count: 1, lastUsage: now });
            return { hasLimit: false };
        }

        userLimits.count = userLimits.count + 1;

        const diff = now - userLimits.lastUsage;
        if (diff < minutes && userLimits.count >= count) {
            return {
                hasLimit: true,
                time: time(Math.floor((userLimits.lastUsage + minutes) / 1000), 'R'),
            };
        }

        if (diff > minutes) MemberManager.limits.delete(id);
        else MemberManager.limits.set(id, userLimits);
        return { hasLimit: false };
    }

    static setRoles(member: GuildMember, params: string[] | string) {
        if (!member.manageable) return undefined;

        const roles = member.roles.cache
            .filter((role) => role.managed)
            .map((role) => role.id)
            .concat(params);
        return member.roles.set(roles);
    }

    static checkUser(client: Client, message: Message, member: GuildMember) {
        const botCommandRole = message.guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);

        if (member.user.bot) {
            return client.utils.sendTimedMessage(message, 'Botlara işlem yapamazsın!');
        }

        if (member.id === message.member.id) {
            return client.utils.sendTimedMessage(message, 'Kendinize işlem yapamazsın!');
        }

        if (message.member.id === member.roles.highest.id) {
            return client.utils.sendTimedMessage(
                message,
                `${member.user.username} ile aynı yetkidesin! Kullanıcıya işlem yapamazsın.`,
            );
        }

        if (member.id === client.user.id) {
            return client.utils.sendTimedMessage(message, 'Botlara işlem uygulayamazsın!');
        }

        if (member.roles.highest.rawPosition >= message.member.roles.highest.rawPosition) {
            return client.utils.sendTimedMessage(message, `${member.user.username} senden daha üst bir yetkiye sahip!`);
        }

        if (message.guild.members.me.roles.highest.id === member.roles.highest.id) {
            return client.utils.sendTimedMessage(
                message,
                `${member.user.username} benimle aynı yetkiye sahip! Kullanıcıya işlem yapamam!`,
            );
        }

        if (
            member.roles.highest.position >= botCommandRole.position &&
            !message.member.permissions.has(PermissionFlagsBits.Administrator)
        ) {
            return client.utils.sendTimedMessage(
                message,
                `${member.user.username} bir yetkil! Yetkililere işlem uygulamazsın!`,
            );
        }

        return null;
    }

    static isSnowflake(id: string) {
        return BigInt(id).toString() === id;
    }

    static async getMember(guild: Guild, id: string): Promise<GuildMember> {
        if (!id || !MemberManager.isSnowflake(id.replace(/\D/g, ''))) return;

        const cache = guild.members.cache.get(id.replace(/\D/g, ''));
        if (cache) return cache;

        let result;
        try {
            result = await guild.members.fetch({ user: id.replace(/\D/g, ''), force: true, cache: true });
        } catch (e) {
            result = undefined;
        }
        return result;
    }

    static async getUser(client: Client, id: string): Promise<User> {
        if (!id || !MemberManager.isSnowflake(id.replace(/\D/g, ''))) return;

        const cache = client.users.cache.get(id.replace(/\D/g, ''));
        if (cache) return cache;

        let result;
        try {
            result = await client.users.fetch(id.replace(/\D/g, ''), { force: true, cache: true });
        } catch (e) {
            result = undefined;
        }
        return result;
    }
}

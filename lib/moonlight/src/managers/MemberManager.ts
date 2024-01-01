import { Client } from '@/base';
import { Guild, GuildMember, User } from 'discord.js';

export class MemberManager {
    static setRoles(member: GuildMember, params: string[] | string) {
        if (!member.manageable) return undefined;

        const roles = member.roles.cache
            .filter((role) => role.managed)
            .map((role) => role.id)
            .concat(params);
        return member.roles.set(roles);
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

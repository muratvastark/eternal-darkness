import { Client } from '@/base';
import { Guild } from 'discord.js';
import { schedule } from 'node-cron';
import ms from 'ms';

export function monthlyRole(client: Client, guild: Guild) {
    schedule('0 0 0 * * *', async () => {
        const monthlyRoles = client.config.SERVER.MONTHLY_ROLES.sort((a, b) => ms(a.TIME) - ms(b.TIME));
        const allRoles = monthlyRoles.map((m) => m.ROLE);

        const now = Date.now();
        guild.members.cache
            .filter((m) =>
                [
                    ...client.config.SERVER.MAN_ROLES,
                    ...client.config.SERVER.WOMAN_ROLES,
                    client.config.SERVER.REGISTERED_ROLE,
                ].some((role) => m.roles.cache.some((r) => r.name === role)),
            )
            .forEach(async (m) => {
                for (const monthlyRole of monthlyRoles) {
                    if (now - m.joinedTimestamp >= ms(monthlyRole.TIME) && !m.roles.cache.has(monthlyRole.ROLE)) {
                        await m.roles.remove(allRoles.filter((r) => r !== monthlyRole.ROLE));
                        await m.roles.add(monthlyRole.ROLE);
                        break;
                    }
                }
            });
    });
}

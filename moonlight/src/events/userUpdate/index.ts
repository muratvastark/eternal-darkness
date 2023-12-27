import { Events, User } from 'discord.js';

import { anotherTagHandler } from './anotherTagHandler';
import bannedTagHandler from './bannedTagHandler';
import tagHandler from './tagHandler';
import { MemberManager } from '@/managers';

const UserUpdate: Moonlight.IEvent<Events.UserUpdate> = {
    name: Events.UserUpdate,
    execute: async (client, oldUser, newUser) => {
        if (oldUser.bot || oldUser.displayName === newUser.displayName) return;

        const guild = client.guilds.cache.get(client.config.BOT.GUILD_ID);
        if (!guild) return;

        const member = await MemberManager.getMember(guild, newUser.id);
        if (
            !member ||
            [client.config.SERVER.UNDERWORLD_ROLE, client.config.SERVER.QUARANTINE_ROLE].some((role) =>
                member.roles.cache.has(role),
            )
        )
            return;

        const hasBannedTag = await bannedTagHandler(client, oldUser as User, newUser, member);
        if (hasBannedTag) return;

        anotherTagHandler(client, newUser, member);
        if (client.config.SERVER.TAGGED_SERVER) tagHandler(client, oldUser as User, newUser, member);
    },
};

export default UserUpdate;

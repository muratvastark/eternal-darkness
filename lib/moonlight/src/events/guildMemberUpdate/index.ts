import { Events, GuildMember } from 'discord.js';

import boostHandler from './boostHandler';
import punishHandler from './punishHandler';
import roleLog from './roleLog';

const GuildMemberUpdate: Moonlight.IEvent<Events.GuildMemberUpdate> = {
    name: Events.GuildMemberUpdate,
    execute: (client, oldMember, newMember) => {
        if (newMember.user.bot) return;

        boostHandler(client, oldMember as GuildMember, newMember);
        punishHandler(client, oldMember as GuildMember, newMember);
        roleLog(oldMember as GuildMember, newMember);
    },
};

export default GuildMemberUpdate;

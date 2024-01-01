import { Events } from 'discord.js';

import welcomeHandler from './welcomeHandler';
import checkSuspect from './checkSuspect';
import checkPenals from './checkPenals';
import checkBannedTag from './checkBannedTag';
import mentionChannel from './mentionChannel';

const GuildMemberAdd: Moonlight.IEvent<Events.GuildMemberAdd> = {
    name: Events.GuildMemberAdd,
    execute: async (client, member) => {
        if (member.user.bot) return;

        mentionChannel(member);

        const hasPenal = await checkPenals(client, member);
        if (hasPenal) return;

        const hasBannedTag = await checkBannedTag(client, member);
        if (hasBannedTag) return;

        const isSuspect = await checkSuspect(client, member);
        if (isSuspect) return;

        welcomeHandler(client, member);
    },
};
export default GuildMemberAdd;

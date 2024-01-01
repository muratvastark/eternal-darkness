import { StatManager } from '@/managers';
import { IEvent } from '@/types';
import { Events } from 'discord.js';

const InviteCreate: IEvent<Events.InviteCreate> = {
    name: Events.InviteCreate,
    execute: (client, invite) => {
        StatManager.invites.set(invite.code, {
            code: invite.code,
            inviter: invite.inviter,
            uses: invite.uses,
        });
    },
};

export default InviteCreate;

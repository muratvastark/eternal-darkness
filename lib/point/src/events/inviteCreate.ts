import { StaffManager } from '@/managers';
import { IEvent } from '@/types';
import { Events } from 'discord.js';

const InviteCreate: IEvent<Events.InviteCreate> = {
    name: Events.InviteCreate,
    execute(_, invite) {
        StaffManager.invites.set(invite.code, {
            code: invite.code,
            uses: invite.uses,
            inviter: invite.inviter,
        });
    },
};

export default InviteCreate;

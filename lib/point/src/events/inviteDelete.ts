import { StaffManager } from '@/managers';
import { IEvent } from '@/types';
import { Events } from 'discord.js';

const InviteDelete: IEvent<Events.InviteDelete> = {
    name: Events.InviteDelete,
    execute(_, invite) {
        StaffManager.invites.delete(invite.code);
    },
};

export default InviteDelete;

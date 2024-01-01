import { StatManager } from '@/managers';
import { IEvent } from '@/types';
import { Events } from 'discord.js';

const InviteDelete: IEvent<Events.InviteDelete> = {
    name: Events.InviteDelete,
    execute: (_, invite) => {
        StatManager.invites.delete(invite.code);
    },
};

export default InviteDelete;

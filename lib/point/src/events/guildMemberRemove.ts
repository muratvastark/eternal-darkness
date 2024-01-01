import { StaffModel } from '@/models';
import { IEvent } from '@/types';
import { Events } from 'discord.js';

const GuildMemberRemove: IEvent<Events.GuildMemberRemove> = {
    name: Events.GuildMemberRemove,
    async execute(client, member) {
        if (member.user.bot) return;

        await StaffModel.updateOne(
            { invitedUsers: member.id },
            {
                $pull: { invitedUsers: member.id },
                $inc: {
                    totalPoints: -client.config.SERVER.INVITE_POINT,
                    allPoints: -client.config.SERVER.INVITE_POINT,
                },
            },
        );
    },
};

export default GuildMemberRemove;

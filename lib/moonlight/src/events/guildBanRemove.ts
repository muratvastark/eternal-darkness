import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { Events } from 'discord.js';

const GuildBanRemove: Moonlight.IEvent<Events.GuildBanRemove> = {
    name: Events.GuildBanRemove,
    execute: async (client, ban) => {
        try {
            const hasForceBan = await PenalModel.exists({
                user: ban.user.id,
                activity: true,
                tpye: PenalFlags.ForceBan,
            });
            if (!hasForceBan) return;

            ban.guild.members.ban(ban.user.id, { reason: 'Sağ tıkla kaldırıldığı için geri atıldı.' });
        } catch (err) {
            console.log('Guild Ban Remove:', err);
        }
    },
};

export default GuildBanRemove;

import { NameFlags } from '@/enums';
import { UserModel } from '@/models';
import { Client } from '@/base';
import { GuildMember } from 'discord.js';
import { MemberManager } from '@/managers';

async function boostHandler(client: Client, oldMember: GuildMember, newMember: GuildMember) {
    if (
        !(oldMember.premiumSince && !newMember.premiumSince) ||
        newMember.roles.cache.has(client.config.SERVER.VIP_ROLE) ||
        [
            client.config.SERVER.UNDERWORLD_ROLE,
            client.config.SERVER.QUARANTINE_ROLE,
            client.config.SERVER.UNREGISTER_ROLE,
        ].some((role) => newMember.roles.cache.has(role))
    )
        return;

    const document = await UserModel.findOne({ id: newMember.id }).select('names');
    const names = document ? document.names.filter((n) => n.type !== NameFlags.Booster) : [];
    if (!names.length) {
        await MemberManager.setRoles(newMember, client.config.SERVER.UNREGISTER_ROLE);
        await newMember.setNickname('İsim | Yaş');
        return;
    }

    const lastName = names[names.length - 1].name;
    await newMember.setNickname(lastName);
}

export default boostHandler;

import { PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { Client } from '@/base';
import { GuildMember } from 'discord.js';
import { MemberManager } from '@/managers';

async function checkPenals(client: Client, member: GuildMember) {
    const penals = await PenalModel.find({ user: member.id, activity: true }).select('type');
    if (!penals.length) return false;

    if (penals.some((p) => p.type === PenalFlags.ForceBan)) {
        member.guild.members.ban(member.id, { reason: 'Bu oç nasıl girebildi amk.' });
        return true;
    }

    if (penals.some((p) => p.type === PenalFlags.Underworld)) {
        MemberManager.setRoles(member, client.config.SERVER.UNDERWORLD_ROLE);
        return true;
    }

    if (penals.some((p) => p.type === PenalFlags.Quarantine)) {
        MemberManager.setRoles(member, client.config.SERVER.QUARANTINE_ROLE);
        return true;
    }

    const roles: string[] = [];
    if (penals.some((p) => p.type === PenalFlags.ChatMute)) roles.push(client.config.SERVER.CHAT_MUTE_ROLE);
    if (penals.some((p) => p.type === PenalFlags.VoiceMute)) roles.push(client.config.SERVER.VOICE_MUTE_ROLE);
    if (roles.length) member.roles.add(roles);

    return false;
}

export default checkPenals;

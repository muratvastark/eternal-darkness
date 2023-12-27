import { ANOTHER_TAGS } from '@/assets';
import { Client } from '@/base';
import { RoleManager } from '@/managers';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
    EmbedBuilder,
    GuildMember,
    Role,
    TextChannel,
    User,
    bold,
    codeBlock,
    inlineCode,
} from 'discord.js';

export async function anotherTagHandler(client: Client, user: User, member: GuildMember) {
    const botCommandRole = member.guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
    if (botCommandRole.position > member.roles.highest.position) return;

    const filteredTags = ANOTHER_TAGS.filter((t) => t !== client.config.SERVER.TAG);
    const tag = filteredTags.find((t) => user.displayName.toLowerCase().includes(t.toLowerCase()));
    if (!tag) return;

    RoleManager.sendStaffText(
        client, 
        member, 
        `başka sunucunun tagını (${inlineCode(tag)}) ismine aldı`, 
        member.roles.cache.filter((r) => botCommandRole.position <= r.position && !r.managed)
    );
    await member.roles.set(member.roles.cache.filter((r) => botCommandRole.position > r.position && !r.managed));
}

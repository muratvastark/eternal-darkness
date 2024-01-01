import { ICommand } from '@/types';
import { codeBlock } from 'discord.js';

const StaffSay: ICommand = {
    usages: ['staffsay', 'yetkilisay', 'yetkili-say', 'ytsay', 'ysay', 'y-say'],
    description: 'Sunucudaki yetkililerin seste olmayanlarını sayar.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179566321189531770', '1179411865697263666'],
    execute: async ({ client, message, args }) => {
        const botCommandRole = message.guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        const role = message.guild.roles.cache.get(args[0]);
        if (role && role.id === message.guild?.roles.everyone.id) {
            client.utils.sendTimedMessage(message, 'Neden herkesi etiketlemek isteyesin ki?');
            return;
        }

        let members = message.guild?.members.cache.filter(
            (member) =>
                !member.user.bot && member.presence && member.presence?.status !== 'offline' && !member.voice.channelId,
        );
        if (role) members = members.filter((member) => member.roles.cache.has(role.id));
        else members = members.filter((member) => member.roles.highest.position >= botCommandRole.position);

        const arr = client.utils.splitMessage(members.map((member) => member.toString()).join(', '), {
            maxLength: 2000,
            char: ',',
        });
        for (const newText of arr)
            message.channel.send({
                content: members.size > 0 ? codeBlock('fix', newText) : 'Mükkemmel! Seste olmayan yetkili yok.',
            });
    },
};

export default StaffSay;

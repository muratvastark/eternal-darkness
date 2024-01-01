import { MemberManager, StaffManager } from '@/managers';
import { PermissionFlagsBits } from 'discord.js';
import newStaff from './newStaff';
import isStaff from './isStaff';
import { ICommand } from '@/types';

const TakeStaff: ICommand = {
    usages: ['takestaff', 'yetkilial', 'alyetkili', 'yetkili', 'stafftake', 'yt'],
    description: 'Yetkili almanızı sağlar.',
    usableAuth: ['1179566321189531770', '1179566376562733157', '1181651887238430820', '1179568373235990629', '1179030512573091930', '1180586262038577292', '1179554144130969713'],
    execute: async ({ client, message, args }) => {
        const member = await MemberManager.getMember(message.guild, args[0]);

        if (!member) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        if (member.user.bot) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı bir bot!');
        if (member.id === message.author.id) return client.utils.sendTimedMessage(message, 'Kendine işlem yapamazsın.');

        if (!StaffManager.checkStaff(member)) newStaff(client, message, member);
        else {
            if (
                !['1179030512573091930', '1180586262038577292', '1179554144130969713', '1179566321189531770'].some(r => message.member.roles.cache.has(r)) &&
                !message.member.permissions.has(PermissionFlagsBits.Administrator)
            ) {
                client.utils.sendTimedMessage(message, 'Sadece yetkili alabilirsin.');
                return;
            }
            isStaff(client, message, member);
        }
    },
};

export default TakeStaff;

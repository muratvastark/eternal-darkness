import { ICommand } from '@/types';
import { codeBlock } from 'discord.js';

const RoleInfo: ICommand = {
    usages: ['rolbilgi', 'rol-bilgi', 'roleinfo', 'role-info', 'rolinfo'],
    description: 'Belirtilen rolün detaylarını gösterir.',
    usableAuth: ['1179030512573091930', '1179403561747095552'],
    execute: ({ client, message, args }) => {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role || role.id === message.guild.id) {
            client.utils.sendTimedMessage(message, 'Geçerli bir rol belirtmelisin!');
            return;
        }

        const char = args.includes('etiket') ? ', ' : '\n';
        const members = message.guild.members.cache.filter((m) => m.roles.cache.has(role.id));

        const text = members
            .map((member) => (args.includes('etiket') ? member.toString() : `${member.displayName} (${member.id})`))
            .join(char);
        const texts = client.utils.splitMessage(text, { maxLength: 1500, char });
        for (const text of texts) message.channel.send(codeBlock('fix', text));
    },
};

export default RoleInfo;

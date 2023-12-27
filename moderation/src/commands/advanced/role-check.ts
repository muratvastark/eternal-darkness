import { ICommand } from '@/types';
import { codeBlock } from 'discord.js';

const RoleCheck: ICommand = {
    usages: ['roldenetim', 'rol-denetim'],
    description: 'Belirttiğiniz rolün üye bilgilerini gösterir.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713'],
    execute: async ({ client, message, args }) => {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role || role.id === message.guild?.id) {
            client.utils.sendTimedMessage(message, 'Geçerli bir rol belirtmelisin!');
            return;
        }

        const offlineMembers = message.guild.members.cache.filter(
            (m) => m.roles.cache.has(role.id) && m.presence?.status === 'offline',
        );
        const voiceMembers = message.guild.members.cache.filter((m) => m.roles.cache.has(role.id) && m.voice.channelId);
        const notVoiceMembers = message.guild.members.cache.filter(
            (m) => m.roles.cache.has(role.id) && !m.voice.channelId,
        );

        const voiceText = voiceMembers.map((member) => `→ ${member.displayName} (${member.id})`).join('\n');
        const voice = client.utils.splitMessage(
            `# Roldeki Seste Olan Kullanıcılar (${voiceMembers.size})\n${voiceText}`,
            { maxLength: 2000, char: '\n' },
        );

        const notVoiceText = notVoiceMembers.map((member) => `→ ${member.displayName} (${member.id})`).join('\n');
        const notVoice = client.utils.splitMessage(
            `# Roldeki Seste Olmayan Kullanıcılar (${notVoiceMembers.size})\n${notVoiceText}`,
            { maxLength: 2000, char: '\n' },
        );

        const offlineText = offlineMembers.map((member) => `→ ${member.displayName} (${member.id})`).join('\n');
        const arr = client.utils.splitMessage(
            `# Roldeki Çevrimdışı Kullanıcılar (${offlineMembers.size})\n${offlineText}`,
            { maxLength: 2000, char: '\n' },
        );

        if (4000 > offlineText.length + voiceText.length + notVoiceText.length) {
            message.channel.send({
                content: [
                    codeBlock('md', `# ${role.name} (${role.id}) | ${role.members.size} Üye`),
                    codeBlock('yaml', arr[0]),
                    codeBlock('yaml', voice[0]),
                    codeBlock('yaml', notVoice[0]),
                ].join(''),
            });
            return;
        }

        for (let i = 0; arr.length > i; i++) {
            const newText = arr[i];
            message.channel.send({
                content:
                    i === 0
                        ? `${codeBlock('md', `# ${role.name} (${role.id}) | ${role.members.size} Üye`)}${codeBlock(
                              'yaml',
                              newText,
                          )}`
                        : codeBlock('yaml', newText),
            });
        }

        for (const newText of voice) message.channel.send({ content: codeBlock('yaml', newText) });
        for (const newText of notVoice) message.channel.send({ content: codeBlock('yaml', newText) });
    },
};

export default RoleCheck;

import { MemberManager } from '@/managers';
import { ICommand } from '@/types';
import {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    ComponentType,
} from 'discord.js';

const Avatar: ICommand = {
    usages: ['avatar', 'pp', 'av'],
    description: 'Belirttiğiniz kullanıcının avatarını gösterir.',
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : await message.author.fetch());

        const embed = new EmbedBuilder({
            author: {
                name: user.username,
                icon_url: user.displayAvatarURL({ size: 4096 }),
            },
            color: client.utils.getRandomColor(),
            title: 'Discord Kullanıcı Profili',
            timestamp: Date.now(),
            image: {
                url: user.displayAvatarURL({
                    size: 4096,
                }),
            },
        });

        const components = [
            new ActionRowBuilder<StringSelectMenuBuilder>({
                components: [
                    new StringSelectMenuBuilder({
                        custom_id: 'avatar',
                        placeholder: 'Bakacağınız resmi seçin!',
                        options: [{ label: 'Discord Kullanıcı Profili', value: 'discord-avatar', default: true }],
                    }),
                ],
            }),
        ];

        if (user.banner)
            components[0].components[0].addOptions([{ label: 'Discord Kullanıcı Bannerı', value: 'discord-banner' }]);

        const member = message.guild.members.cache.get(user.id);
        if (member && member.avatar && member.avatar !== user.avatar) {
            components[0].components[0].addOptions([{ label: 'Sunucu Kullanıcı Profili', value: 'server-avatar' }]);
        }

        const question = await message.channel.send({
            embeds: [embed],
            components: components[0].components[0].options.length === 1 ? [] : components,
        });

        if (components[0].components[0].options.length === 1) return;

        const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.StringSelect,
        });

        collector.on('collect', (i: StringSelectMenuInteraction) => {
            i.deferUpdate();

            const value = i.values[0];
            if (value === 'discord-avatar')
                embed.setTitle('Discord Kullanıcı Profili').setImage(user.displayAvatarURL({ size: 4096 }));
            if (value === 'discord-banner')
                embed.setTitle('Discord Kullanıcı Bannerı').setImage(
                    user.bannerURL({
                        size: 4096,
                        extension: user.banner.startsWith('a_') ? 'gif' : 'png',
                    }),
                );
            if (value === 'server-avatar')
                embed.setTitle('Sunucu Kullanıcı Profili').setImage(member.displayAvatarURL({ size: 4096 }));

            question.edit({ embeds: [embed] });
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default Avatar;

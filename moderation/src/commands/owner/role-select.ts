import { ICommand } from '@/types';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    Message,
    StringSelectMenuBuilder,
    bold,
    inlineCode
} from 'discord.js';

const RoleSelect: ICommand = {
    usages: ['roleselect', 'role-select'],
    description: 'Rol seçme mesajını attırırsınız.',
    execute: async ({ client, message }) => {
        if (!client.config.BOT.BOT_OWNERS.includes(message.author.id)) return;

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });
        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'giveaway',
                    label: 'Etkinlik/Çekiliş Mesajı',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'relation',
                    label: 'İlişki Mesajı',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'game',
                    label: 'Oyun Mesajı',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'color',
                    label: 'Renk Mesajı',
                    style: ButtonStyle.Primary,
                }),
                new ButtonBuilder({
                    custom_id: 'zodiac',
                    label: 'Burç Mesajı',
                    style: ButtonStyle.Primary,
                }),
            ],
        });

        const question = await message.channel.send({
            embeds: [embed.setDescription('Hangi rol alma sistemini istiyorsanız o butona basmanız yeterli!')],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id && i.isButton();
        const collector = question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
            componentType: ComponentType.Button,
        });

        collector.on('collect', (i: ButtonInteraction) => {
            i.deferUpdate();

            if (i.customId === 'giveaway') {
                const row = new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            custom_id: 'event-role',
                            emoji: '🎉',
                            label: 'Etkinlik Katılımcısı',
                            style: ButtonStyle.Success,
                        }),
                        new ButtonBuilder({
                            custom_id: 'giveaway-role',
                            emoji: '🎁',
                            label: 'Çekiliş Katılımcısı',
                            style: ButtonStyle.Success,
                        }),
                    ],
                });
                const rowTwo = new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'color-roles',
                            placeholder: 'Renk rollerini seçmek için tıkla!',
                            options: [
                                {
                                    label: message.guild.roles.cache.get('1179571598349570178').name,
                                    value: '1179571598349570178',
                                    emoji: {
                                        id: '1189183995347480598',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1184299018747134054').name,
                                    value: '1184299018747134054',
                                    emoji: {
                                        id: '1189184679534923796',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1179572643603677265').name,
                                    value: '1179572643603677265',
                                    emoji: {
                                        id: '1189184594759651449',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1179572639577157632').name,
                                    value: '1179572639577157632',
                                    emoji: {
                                        id: '1189184505190285344',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1179571599742095521').name,
                                    value: '1179571599742095521',
                                    emoji: {
                                        id: '1189184425888600104',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1179572636523696178').name,
                                    value: '1179572636523696178',
                                    emoji: {
                                        id: '1189184162301751306',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1179891490353328199').name,
                                    value: '1179891490353328199',
                                    emoji: {
                                        id: '1189184332661805197',
                                    },
                                },
                                {
                                    label: 'Rolü Kaldır',
                                    value: 'trash-color',
                                    emoji: {
                                        id: '1189182444218351617',
                                    },
                                },
                            ],
                        }),
                    ],
                });
                const rowThree = new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'love-roles',
                            placeholder: 'İlişki rollerini seçmek için tıkla!',
                            options: [
                                {
                                    label: 'Sevgilim Var',
                                    value: '1179900000923308093',
                                    emoji: {
                                        id: '1181348041509310484',
                                    },
                                },
                                {
                                    label: 'Sevgilim Yok',
                                    value: '1179900002055770232',
                                    emoji: {
                                        id: '1181348039349243954',
                                    },
                                },
                                {
                                    label: 'İlişki Yapmıyorum',
                                    value: '1179900003121106984',
                                    emoji: {
                                        id: '1181348035624710255',
                                    },
                                },
                                {
                                    label: 'Rolü Kaldır',
                                    value: 'trash-relation',
                                    emoji: {
                                        id: '1189182444218351617',
                                    },
                                },
                            ],
                        }),
                    ],
                });
                const rowFour = new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'game-roles',
                            placeholder: 'Oyun rollerini seçmek için tıkla!',
                            max_values: 9,
                            options: [
                                {
                                    label: message.guild.roles.cache.get('1181067563153764422').name,
                                    value: '1181067563153764422',
                                    emoji: {
                                        id: '1157002030066434149',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1181067571731116072').name,
                                    value: '1181067571731116072',
                                    emoji: {
                                        id: '1181063885839675463',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1181068338420535297').name,
                                    value: '1181068338420535297',
                                    emoji: {
                                        id: '1181063879808258158',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1181068364710432768').name,
                                    value: '1181068364710432768',
                                    emoji: {
                                        id: '1181063878231195648',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1181068347945779200').name,
                                    value: '1181068347945779200',
                                    emoji: {
                                        id: '1181063892286328883',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1181068371584876594').name,
                                    value: '1181068371584876594',
                                    emoji: {
                                        id: '1181068103317196800',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1181068355164192778').name,
                                    value: '1181068355164192778',
                                    emoji: {
                                        id: '1181063882920435864',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1181068377020715119').name,
                                    value: '1181068377020715119',
                                    emoji: {
                                        id: '1180725272484511848',
                                    },
                                },
                                {
                                    label: message.guild.roles.cache.get('1181068381756072096').name,
                                    value: '1181068381756072096',
                                    emoji: {
                                        id: '1181067958068453446',
                                    },
                                },
                                {
                                    label: 'Rollerimi Kaldır',
                                    value: 'trash-game',
                                    emoji: {
                                        id: '1189182444218351617',
                                    },
                                },
                            ],
                        }),
                    ],
                });
                const rowFive = new ActionRowBuilder<StringSelectMenuBuilder>({
                    components: [
                        new StringSelectMenuBuilder({
                            custom_id: 'team-roles',
                            placeholder: 'Takım rollerini seçmek için tıkla!',
                            options: [
                                {
                                    label: 'Galatasaray',
                                    value: '1181066376832614441',
                                    emoji: {
                                        id: '1181065755433902212',
                                    },
                                },
                                {
                                    label: 'Fenerbahçe',
                                    value: '1181066412219961394',
                                    emoji: {
                                        id: '1114886717237907496',
                                    },
                                },
                                {
                                    label: 'Beşiktaş',
                                    value: '1181066398886277161',
                                    emoji: {
                                        id: '1114886698212544672',
                                    },
                                },
                                {
                                    label: 'Trabzonspor',
                                    value: '1181066404619882586',
                                    emoji: {
                                        id: '1181065773507162143',
                                    },
                                },
                                {
                                    label: 'Rolü Kaldır',
                                    value: 'trash-team',
                                    emoji: {
                                        id: '1189182444218351617',
                                    },
                                },
                            ],
                        }),
                    ],
                });
                message.channel.send({
                    content: [
                        `Merhaba ${bold('Eternal Darkness')} üyeleri,`,
                        `Çekiliş katılımcısı alarak ${inlineCode('Spotify')}, ${inlineCode('Netflix')}, ${inlineCode(
                            'Nitro',
                        )}, ${inlineCode('Exxen')} gibi çeşitli ödüllerin sahibi olabilirsiniz.`,
                        `Etkinlik katılımcısı alarak çeşitli etkinliklerin yapıldığı anlarda herkesten önce haberdar olabilirsiniz ve çekilişlere önceden katılma hakkı kazanabilirsiniz.`,
                        `Aşağıda ki butonlara basarak siz de bu ödülleri kazanmaya hemen başlayabilirsiniz!`,
                    ].join('\n'),
                    components: [row, rowTwo, rowThree, rowFour, rowFive],
                });
            }

            if (i.customId === 'relation') {
                menuCreate(
                    message,
                    'İlişki rollerini seçmek için tıkla!',
                    'love-roles',
                    client.config.SERVER.LOVE_ROLES,
                );
            }
            if (i.customId === 'game') {
                menuCreate(message, 'Oyun rollerini seçmek için tıkla!', 'game-roles', client.config.SERVER.GAME_ROLES);
            }
            if (i.customId === 'color') {
                menuCreate(
                    message,
                    'Renk rollerini seçmek için tıkla!',
                    'color-roles',
                    client.config.SERVER.COLOR_ROLES,
                );
            }
            if (i.customId === 'zodiac') {
                menuCreate(
                    message,
                    'Takım rollerini seçmek için tıkla!',
                    'zodiac-roles',
                    client.config.SERVER.ZODIAC_ROLES,
                );
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default RoleSelect;

async function menuCreate(message: Message, placeholder: string, customId: string, options: string[]) {
    const row = new ActionRowBuilder<StringSelectMenuBuilder>({
        components: [
            new StringSelectMenuBuilder({
                custom_id: customId,
                placeholder: placeholder,
                options: options.map((rol) => ({
                    label: message.guild.roles.cache.get(rol).name,
                    value: rol,
                })),
            }),
        ],
    });
    await message.channel.send({ components: [row] });
}

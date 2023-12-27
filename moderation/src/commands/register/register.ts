import { UserModel } from '@/models';
import {
    EmbedBuilder,
    inlineCode,
    TextChannel,
    bold,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    time,
    ButtonInteraction,
    ComponentType,
} from 'discord.js';
import { NameFlags, RegisterFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { ICommand } from '@/types';

const titles = {
    [NameFlags.Man]: 'Kayıt Olma (Erkek)',
    [NameFlags.Woman]: 'Kayıt Olma (Kız)',
    [NameFlags.ChangeName]: 'İsim Değiştirme (Yetkili)',
    [NameFlags.Booster]: 'İsim Değiştirme (Boost)',
    [NameFlags.AutoRegister]: 'Oto Kayıt',
};

const Register: ICommand = {
    usages: ['register', 'woman', 'kız', 'kadın', 'bayan', 'k', 'e'],
    description: 'Belirttiğiniz üyeyi kadın olarak kayıt edersiniz.',
    usableAuth: [
        '1179885310323208242',
        '1179568339580891176',
        '1179030512573091930',
        '1179403561747095552',
        '1179554144130969713',
        '1179554128347803669',
        '1179554153362628669',
    ],
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await MemberManager.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
            return;
        }

        if (
            [
                ...client.config.SERVER.WOMAN_ROLES,
                ...client.config.SERVER.MAN_ROLES,
                client.config.SERVER.REGISTERED_ROLE,
            ].some((role) => member.roles.cache.has(role))
        ) {
            client.utils.sendTimedMessage(message, 'Kayıtlı olmayan geçerli birini belirtmelisin.');
            return;
        }

        if (MemberManager.checkUser(client, message, member)) return;

        args = args.splice(reference ? 0 : 1);
        const name = args
            .filter((arg) => isNaN(parseInt(arg)))
            .map((arg) => arg[0].toUpperCase() + arg.slice(1).toLowerCase())
            .join(' ');
        if (!name || name.length > 15) {
            client.utils.sendTimedMessage(message, '15 karakteri geçmeyecek isim girmelisin.');
            return;
        }

        const age = Number(args.filter((arg) => !isNaN(parseInt(arg)))[0]);
        if (!age || 16 > age) {
            client.utils.sendTimedMessage(message, '2 karakteri geçmeyecek yaş girmelisin.');
            return;
        }

        let newName = `∙ ${name} | ${age}`;
        if (client.config.SERVER.TAGGED_SERVER) {
            const hasTag = member.user.displayName.includes(client.config.SERVER.TAG);
            newName = `${hasTag ? client.config.SERVER.TAG : client.config.SERVER.UNTAGGED_TAG} ${name} | ${age}`;
        }

        const row = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    custom_id: 'man',
                    label: 'Erkek',
                    style: ButtonStyle.Secondary,
                    emoji: '1157030987482533908',
                }),
                new ButtonBuilder({
                    custom_id: 'woman',
                    label: 'Kadın',
                    style: ButtonStyle.Secondary,
                    emoji: '1157030990330462321',
                }),
            ],
        });

        const document = (await UserModel.findOne({ id: member.id })) || new UserModel({ id: member.id });
        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({ forceStatic: true }),
            },
            description:
                document.names.length > 0
                    ? [
                          `${member} kişisinin ismi "${bold(
                              `${name} | ${age}`,
                          )}" olarak değiştirildi, bu üye daha önce bu isimlerle kayıt olmuş.\n`,
                          `Kişinin toplamda ${bold(document.names.length.toString())} isim kayıtı bulundu.`,
                          `${document.names
                              .slice(
                                  document.names.length ? document.names.length - 10 : 0,
                                  document.names.length ? document.names.length : 10,
                              )
                              .map(
                                  (n) =>
                                      `${inlineCode(`•`)} ${time(Math.floor(n.timestamp / 1000), 'D')}: ${
                                          n.name ? n.name : undefined
                                      } ${bold(`(${titles[n.type]})`)}`,
                              )
                              .join('\n')}\n`,
                          `Kişinin önceki isimlerine ${inlineCode(
                              `${client.config.BOT.PREFIXES[0]}isimler @üye`,
                          )} komutuyla bakarak kayıt işlemini gerçekleştirmeniz önerilir.`,
                      ].join('\n')
                    : `${member} kişisinin ismi "${bold(`${name} | ${age}`)}" olarak değiştirildi.`,
        });

        const question = await message.channel.send({
            embeds: [embed],
            components: [row],
        });

        const filter = (i: ButtonInteraction) => i.user.id === message.author.id;
        const collector = await question.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 3,
            componentType: ComponentType.Button,
        });
        collector.on('collect', async (collected: ButtonInteraction) => {
            collector.stop('FINISHED');

            const roles = [...client.config.SERVER[collected.customId === 'man' ? 'MAN_ROLES' : 'WOMAN_ROLES']];
            if (member.user.displayName.includes(client.config.SERVER.TAG) && client.config.SERVER.TAGGED_SERVER)
                roles.push(client.config.SERVER.FAMILY_ROLE);
            await MemberManager.setRoles(member, [...new Set(roles)]);
            await member.setNickname(newName);

            question.edit({
                embeds: [
                    embed.setDescription(
                        `${member} üyesi başarıyla ${inlineCode(
                            collected.customId === 'man' ? 'erkek' : 'kadın',
                        )} olarak kayıt edildi.`,
                    ),
                ],
                components: [],
            });
            const chatChannel = message.guild.channels.cache.get(client.config.SERVER.CHAT_CHANNEL) as TextChannel;
            if (chatChannel) {
                chatChannel
                    .send({
                        content: `${member} aramıza hoşgeldin, seninle beraber ${bold(
                            message.guild.memberCount.toString(),
                        )} kişi olduk.`,
                    })
                    .then((msg) => setTimeout(() => msg.delete(), 5000));
            }

            await UserModel.updateOne(
                { id: member.id },
                {
                    $push: {
                        names: {
                            admin: message.author.id,
                            type: collected.customId === 'man' ? NameFlags.Man : NameFlags.Woman,
                            timestamp: Date.now(),
                            name: `∙ ${name} | ${age}`,
                        },
                    },
                },
                { upsert: true },
            );

            await UserModel.updateOne(
                { id: message.author.id },
                {
                    $push: {
                        registers: {
                            type: collected.customId === 'man' ? RegisterFlags.Man : RegisterFlags.Woman,
                            user: member.id,
                        },
                    },
                },
                { upsert: true },
            );

            const registerLogChannel = message.guild.channels.cache.find(
                (c) => c.name === 'register-log',
            ) as TextChannel;
            if (registerLogChannel) {
                registerLogChannel.send({
                    content: `${member} (${inlineCode(member.id.toString())}) adlı kullanıcı ${
                        message.author.username
                    } (${inlineCode(message.author.id.toString())}) tarafından kayıt edildi.`,
                });
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
        });
    },
};

export default Register;

import { LimitFlags, PenalFlags } from '@/enums';
import { MemberManager, PenalManager } from '@/managers';
import { PenalModel, UserModel } from '@/models';
import { Client } from '@/base';
import {
    EmbedBuilder,
    PermissionFlagsBits,
    bold,
    inlineCode,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    ComponentType,
    APISelectMenuOption,
    ModalSubmitInteraction,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder,
    GuildMember,
    Message,
    User,
    time,
} from 'discord.js';
import ms from 'ms';
import { ICommand } from '@/types';

const Quarantine: ICommand = {
    usages: ['jail', 'quarantine', 'cezalı', 'karantina'],
    description: 'Sunucuda taşkınlık yaratan bir kullanıcıya karantina cezası vermenizi sağlar.',
    usableAuth: ['1179030512573091930', '1179403561747095552', '1179554144130969713', '1179568351253643375'],
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const limit = MemberManager.checkLimit(
            message.author.id,
            LimitFlags.Quarantine,
            message.member.roles.cache.has('1179403561747095552') ? 10 : 3,
            1000 * 60 * 10,
        );
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum karantina limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        const member = await MemberManager.getMember(message.guild, user.id);
        if (member) {
            if (MemberManager.checkUser(client, message, member)) return;
            if (member.roles.cache.has(client.config.SERVER.PENALS.QUARANTINE.ROLE)) {
                client.utils.sendTimedMessage(message, 'Kullanıcı zaten cezalı durumunda.');
                return;
            }
        }

        const reasons = client.config.SERVER.PENALS.QUARANTINE.REASONS;

        const options: APISelectMenuOption[] = [
            ...reasons.map((l, i) => ({
                label: l.TITLE,
                placeholder: l.DESCRIPTION,
                value: `${i}`,
                emoji: {
                    id: '1135792463425056838',
                },
            })),
            {
                label: 'Başka Bir Sebep Varsa Seçiniz.',
                value: 'other',
                emoji: {
                    id: '1135792274161274991',
                },
            },
        ];

        const row = new ActionRowBuilder<StringSelectMenuBuilder>({
            components: [
                new StringSelectMenuBuilder({
                    custom_id: 'quarantine',
                    placeholder: 'Sebep seçilmemiş!',
                    options,
                }),
            ],
        });

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                iconURL: message.author.displayAvatarURL({ forceStatic: true }),
            },
        });

        const question = await message.reply({
            content: `${user} kullanıcısına yazı susturması işlemi uygulamak için aşağıdaki menüden sebep seçiniz!`,
            components: [row],
        });
        const filter = (i: StringSelectMenuInteraction) => i.user.id === message.author.id;
        const collected = await question.awaitMessageComponent({
            filter,
            time: 1000 * 60 * 3,
            componentType: ComponentType.StringSelect,
        });

        if (collected) {
            if (collected.values[0] === 'other') {
                const rowOne = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'time',
                            max_length: 3,
                            label: 'Süre',
                            required: true,
                            placeholder: '5m',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });
                const rowTwo = new ActionRowBuilder<TextInputBuilder>({
                    components: [
                        new TextInputBuilder({
                            custom_id: 'reason',
                            max_length: 50,
                            required: true,
                            label: 'Sebep',
                            placeholder: 'Rahatsızlık vermek.',
                            style: TextInputStyle.Short,
                        }),
                    ],
                });

                const modal = new ModalBuilder({
                    custom_id: 'quarantine-modal',
                    title: 'Ses Susturması',
                    components: [rowOne, rowTwo],
                });

                await collected.showModal(modal);

                const modalCollector = await collected.awaitModalSubmit({
                    filter: (i: ModalSubmitInteraction) => i.user.id === message.author.id,
                    time: 1000 * 60 * 5,
                });
                if (modalCollector) {
                    modalCollector.deferUpdate();

                    const timing = ms(modalCollector.fields.getTextInputValue('time'));
                    const reason = modalCollector.fields.getTextInputValue('reason');

                    if (!timing) {
                        if (question.deletable) question.delete();
                        client.utils.sendTimedMessage(message, 'Geçerli bir süre belirt!');
                        return;
                    }
                    if (timing < ms('30s') || ms('1y') < timing) {
                        if (question.deletable) question.delete();
                        client.utils.sendTimedMessage(message, 'En fazla 1 yıl veya en az 30 saniye girebilirsin.');
                        return;
                    }

                    quarantineUser(client, message, user, member, timing, reason, false, question);
                } else question.edit({ components: [client.utils.timesUpButton()] });
                return;
            }

            collected.deferUpdate();

            const reason = reasons[parseInt(collected.values[0])];
            if (reason.NEED_TYPE === 'IMAGE') {
                question.edit({
                    embeds: [
                        embed.setDescription(
                            'Kanıt için ekran görüntüsünü atınız. 2 dakika süreniz var, atılmazsa işlem iptal edilecek.',
                        ),
                    ],
                    components: [],
                });
                const filter = (msg: Message) => msg.author.id === message.author.id && msg.attachments.size > 0;
                const collected = await message.channel.awaitMessages({
                    filter,
                    time: 1000 * 60 * 60,
                    max: 1,
                });
                if (collected) {
                    const attachment = collected.first().attachments.first().proxyURL;
                    quarantineUser(
                        client,
                        message,
                        user,
                        member,
                        ms(reason.TIME),
                        reason.TITLE,
                        false,
                        question,
                        attachment,
                    );
                } else question.edit({ components: [client.utils.timesUpButton()] });
                return;
            }

            if (reason.NEED_TYPE === 'USER') {
                question.edit({
                    embeds: [
                        embed.setDescription(
                            "Kullanıcının ID'sini atınız. 2 dakika süreniz var, atılmazsa işlem iptal edilecek.",
                        ),
                    ],
                    components: [],
                });
                const filter = async (msg: Message) => {
                    if (msg.author.id !== message.author.id) return false;
                    return !!(await MemberManager.getUser(client, msg.content));
                };
                const collected = await message.channel.awaitMessages({
                    filter,
                    time: 1000 * 60 * 60,
                    max: 1,
                });
                if (collected) {
                    const user = await MemberManager.getUser(client, collected.first().content);
                    quarantineUser(
                        client,
                        message,
                        user,
                        member,
                        ms(reason.TIME),
                        `${reason.TITLE}\nHesap: ${user.username} (${user.id})`,
                        false,
                        question,
                    );
                } else question.edit({ components: [client.utils.timesUpButton()] });
                return;
            }

            quarantineUser(client, message, user, member, ms(reason.TIME), reason.TITLE, false, question);
        } else question.edit({ components: [client.utils.timesUpButton()] });
    },
};

export default Quarantine;

export async function quarantineUser(
    client: Client,
    message: Message,
    user: User,
    member: GuildMember,
    timing: number,
    reason: string,
    system: boolean = false,
    question?: Message,
    image?: string,
) {
    await PenalModel.updateMany({ user: user.id, visible: true, activity: true }, { $set: { activity: false } });

    const roles = member
        ? member.roles.cache.filter((r) => !r.managed && r.id !== message.guildId).map((r) => r.id)
        : [];

    if (member) MemberManager.setRoles(member, client.config.SERVER.PENALS.QUARANTINE.ROLE);

    const now = Date.now();
    const penal = await PenalManager.createPenal({
        user: user.id,
        type: PenalFlags.Quarantine,
        admin: question ? message.author.id : client.user.id,
        reason: reason,
        finishTimestamp: now + timing,
        createdTimestamp: now,
        roles,
    });

    await PenalManager.sendLog({
        guild: message.guild,
        channelName: 'quarantine-log',
        penal,
        user: user,
        admin: message.author,
        attachment: image,
        type: 'cezalı',
    });

    const query = {
        content: '',
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: `${user} (${inlineCode(user.id)}) adlı ${
                    system ? reason : `kullanıcı "${bold(reason)}" sebebiyle`
                } ${time(
                    Math.floor(penal.finishTimestamp / 1000),
                    'R',
                )} karantina cezası aldı. (Ceza Numarası: ${inlineCode(`#${penal.id}`)})`,
            }),
        ],
        components: [],
    };
    if (question) question.edit(query);
    else message.channel.send(query);
}

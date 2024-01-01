import { LimitFlags, PenalFlags } from '@/enums';
import { PenalModel } from '@/models';
import { Client } from '@/base';
import {
    EmbedBuilder,
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
import { quarantineUser } from './quarantine';
import { MemberManager, PenalManager } from '@/managers';
import { ICommand } from '@/types';

const VoiceMute: ICommand = {
    usages: ['voicemute', 'voice-mute', 'vmute', 'v-mute'],
    description: 'Ses kanallarında kurallara uymayan kullanıcıları susturmanızı sağlar.',
    usableAuth: [
        '1179566358434939032',
        '1179568355343089765',
        '1179554153362628669',
        '1179554128347803669',
        '1179554144130969713',
        '1179403561747095552',
        '1179030512573091930',
        '1179566334460317808',
        '1179568335713730570',
    ],
    execute: async ({ client, message, args }) => {
        const user =
            (await MemberManager.getUser(client, args[0])) ||
            (message.reference ? (await message.fetchReference()).author : undefined);
        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (
            !message.member.roles.cache.has('1179403561747095552') &&
            !message.member.roles.cache.has('1179030512573091930')
        ) {
            const limit = MemberManager.checkLimit(message.author.id, LimitFlags.Mute, 5, 1000 * 60 * 10);
            if (limit.hasLimit) {
                client.utils.sendTimedMessage(
                    message,
                    `Atabileceğiniz maksimum susturma limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
                );
                return;
            }
        }

        const member = await MemberManager.getMember(message.guild, user.id);
        if (member) {
            if (MemberManager.checkUser(client, message, member)) return;
            if (member.roles.cache.has(client.config.SERVER.PENALS.VOICE_MUTE.ROLE)) {
                client.utils.sendTimedMessage(message, 'Kullanıcı susturulmuş.');
                return;
            }
        }

        const reasons = client.config.SERVER.PENALS.VOICE_MUTE.REASONS;

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
                    custom_id: 'voice-mute',
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
            content: `${user} kullanıcısına ses susturması işlemi uygulamak için aşağıdaki menüden sebep seçiniz!`,
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
                    custom_id: 'voice-mute-modal',
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

                    muteUser(client, message, question, user, member, timing, reason);
                } else {
                    question.edit({
                        embeds: [embed.setDescription('Süre dolduğu için işlem iptal edildi.')],
                    });
                }
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
                    muteUser(client, message, question, user, member, ms(reason.TIME), reason.TITLE, attachment);
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
                    muteUser(
                        client,
                        message,
                        question,
                        user,
                        member,
                        ms(reason.TIME),
                        `${reason.TITLE}\nHesap: ${user.username} (${user.id})`,
                    );
                } else question.edit({ components: [client.utils.timesUpButton()] });
                return;
            }

            muteUser(client, message, question, user, member, ms(reason.TIME), reason.TITLE);
        } else question.edit({ components: [client.utils.timesUpButton()] });
    },
};

export default VoiceMute;

async function muteUser(
    client: Client,
    message: Message,
    question: Message,
    user: User,
    member: GuildMember,
    timing: number,
    reason: string,
    image?: string,
) {
    const operations = client.config.SERVER.MAX_MUTE_PUNISHMENTS;
    if (operations.length) {
        const userPenals = await PenalModel.countDocuments({
            $or: [{ type: PenalFlags.VoiceMute }, { type: PenalFlags.ChatMute }],
            visible: true,
            user: user.id,
        });

        const operation = operations.find((o) => o.COUNT === userPenals);
        if (operation) {
            if (operation.CLEAR) {
                await PenalModel.updateMany(
                    {
                        visible: true,
                        user: user.id,
                        $or: [{ type: PenalFlags.VoiceMute }, { type: PenalFlags.ChatMute }],
                    },
                    { visible: false },
                );
            }

            quarantineUser(
                client,
                message,
                user,
                member,
                ms(operation.TIME),
                `${operation.CLEAR ? 'kullanıcının sicili sıfırlandı ve' : 'kullanıcı'} ${bold(
                    userPenals.toString(),
                )} adet cezaya ulaştığı için`,
                true,
            );
            return;
        }
    }

    if (member) {
        member.roles.add(client.config.SERVER.PENALS.VOICE_MUTE.ROLE);
        if (member.voice.channelId) member.voice.setChannel(null);
    }

    const now = Date.now();
    const penal = await PenalManager.createPenal({
        admin: message.author.id,
        user: user.id,
        type: PenalFlags.ChatMute,
        reason: reason,
        finishTimestamp: now + timing,
        createdTimestamp: now,
    });

    await PenalManager.sendLog({
        guild: message.guild,
        channelName: 'voice-mute-log',
        penal,
        user: user,
        admin: message.author,
        attachment: image,
        type: 'sesli susturma',
    });

    question.edit({
        embeds: [
            new EmbedBuilder({
                color: client.utils.getRandomColor(),
                description: ` ${user} (${inlineCode(user.id)}) adlı kullanıcı "${bold(reason)}" sebebiyle ${time(
                    Math.floor(penal.finishTimestamp / 1000),
                    'R',
                )} ses susturması cezası aldı. (Ceza Numarası: ${inlineCode(`#${penal.id}`)})`,
            }),
        ],
        content: '',
        components: [],
    });
}

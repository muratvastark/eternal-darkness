import { Client } from '@/base';
import { IPunishCommand, IRoleCommand } from '@/types';
import { MemberManager } from './MemberManager';
import { LimitFlags, RoleLogFlags } from '@/enums';
import {
    Colors,
    EmbedBuilder,
    Message,
    PermissionFlagsBits,
    TextChannel,
    bold,
    codeBlock,
    inlineCode,
    roleMention,
    time,
} from 'discord.js';
import { PenalModel, UserModel } from '@/models';
import ms from 'ms';
import { PenalManager } from './PenalManager';

export class GuildCommandManager {
    static logCommand(client: Client, message: Message, content: string) {
        const channel = message.guild.channels.cache.find((c) => c.name === 'command-log') as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    author: {
                        name: message.author.username,
                        iconURL: message.author.displayAvatarURL({ forceStatic: true }),
                    },
                    description: codeBlock('fix', content),
                }),
            ],
        });
    }

    static async roleCommand(client: Client, message: Message, args: string[], command: IRoleCommand) {
        if (
            !message.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !command.AUTH.some((r) => message.member.roles.cache.has(r))
        )
            return;

        const member =
            (await MemberManager.getMember(message.guild, args[0])) ||
            (message.reference ? (await message.fetchReference()).member : undefined);
        if (!member) {
            client.utils.sendTimedMessage(message, 'Lütfen bir kullanıcı etiketleyiniz!');
            return;
        }

        if (MemberManager.checkUser(client, message, member)) return;

        const hasRole = command.ROLES.some((r) => member.roles.cache.has(r));
        if (hasRole) await member.roles.remove(command.ROLES);
        else await member.roles.add(command.ROLES);

        await UserModel.updateOne(
            { id: member.id },
            {
                $push: {
                    roleLogs: {
                        type: hasRole ? RoleLogFlags.Remove : RoleLogFlags.Add,
                        roles: command.ROLES,
                        time: Date.now(),
                        admin: message.author.id,
                    },
                },
            },
            { upsert: true },
        );

        const embed = new EmbedBuilder({
            color: client.utils.getRandomColor(),
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({ forceStatic: true, size: 4096 }),
            },
        });

        const defaultText =
            command.ROLES.length === 1
                ? hasRole
                    ? 'kullanıcıdan {roles} rolü alındı.'
                    : 'kullanıcıya {roles} rolü verildi.'
                : hasRole
                  ? 'kullanıcıdan {roles} rolleri alındı.'
                  : 'kullanıcıya {roles} rolleri verildi.';
        const roles = command.ROLES.map((r) => roleMention(r));

        message.channel.send({
            embeds: [embed.setDescription(`${member} adlı ${defaultText.replace('{roles}', roles.join(', '))}`)],
        });

        const channel = message.guild.channels.cache.find(
            (c) => c.isTextBased() && c.name === 'role-log',
        ) as TextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    embed
                        .setColor(hasRole ? Colors.Red : Colors.Green)
                        .setTitle(hasRole ? 'Rol Çıkarıldı' : 'Rol Eklendi')
                        .setDescription(null)
                        .setAuthor({ name: null, iconURL: null })
                        .setFields([
                            { name: 'Kullanıcı', value: `${member} (${inlineCode(member.id)})`, inline: true },
                            {
                                name: 'Yetkili',
                                value: `${message.author} (${inlineCode(message.author.id)})`,
                                inline: true,
                            },
                            { name: 'Tarih', value: time(Math.floor(Date.now() / 1000)), inline: true },
                            {
                                name: `İşlem Yapılan ${roles.length > 1 ? 'Roller' : 'Rol'}`,
                                value: roles.join(', '),
                                inline: false,
                            },
                        ]),
                ],
            });
        }
    }

    static async unPunishment(client: Client, message: Message, args: string[], command: IPunishCommand) {
        if (
            !message.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !command.AUTH.some((r) => message.member.roles.cache.has(r))
        )
            return;

        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await MemberManager.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (!member.roles.cache.has(command.ROLE)) {
            client.utils.sendTimedMessage(message, 'Kullanıcının cezası yok.');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        await PenalModel.updateMany(
            {
                activity: true,
                user: member.id,
                type: command.TYPE,
            },
            { $set: { activity: false, remover: message.author.id, removeTime: Date.now(), removeReason: reason } },
        );
        member.roles.remove(command.ROLE);

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} kullanıcısının başarıyla ${command.NAME} cezası kaldırıldı.`,
                }),
            ],
        });

        const channel = message.guild.channels.cache.find((c) => c.name === command.CHANNEL) as TextChannel;
        if (!channel) return;

        channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(member.id)}) adlı kullanıcının cezası ${
                        message.author
                    } (${inlineCode(message.author.id)}) tarafından ${bold(
                        reason,
                    )} sebebiyle süresi dolmadan kaldırıldı.`,
                }),
            ],
        });
    }

    static async punishment(client: Client, message: Message, args: string[], command: IPunishCommand) {
        if (
            !message.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !command.AUTH.some((r) => message.member.roles.cache.has(r))
        )
            return;

        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await MemberManager.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        const reason = args.slice(reference ? 0 : 1).join(' ');
        if (!reason.length) {
            client.utils.sendTimedMessage(message, 'Geçerli bir sebep belirt.');
            return;
        }

        const timing = ms(args.slice(reference ? 1 : 2).join(' '));
        if (!timing) {
            client.utils.sendTimedMessage(message, 'Geçerli bir zaman belirt.');
            return;
        }

        const limit = MemberManager.checkLimit(message.author.id, LimitFlags.SpecialCommand);
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum ceza limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        await member.roles.add(command.ROLE);

        const now = Date.now();
        const penal = await PenalManager.createPenal({
            admin: message.author.id,
            user: member.id,
            type: command.TYPE,
            reason: reason,
            finishTimestamp: now + timing,
            createdTimestamp: now,
        });

        const channel = message.guild.channels.cache.find(c => c.name === command.CHANNEL) as TextChannel;
        await PenalManager.sendLog({
            guild: message.guild,
            channelName: 'voice-mute-log',
            penal,
            user: member.user,
            admin: message.author,
            type: channel.name,
        });

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: `${member} (${inlineCode(member.id)}) adlı kullanıcı "${bold(
                        reason,
                    )}" sebebiyle ${time(
                        Math.floor(penal.finishTimestamp / 1000),
                        'R',
                    )} karantina cezası aldı. (Ceza Numarası: ${inlineCode(`#${penal.id}`)})`,
                }),
            ],
        });
    }
}

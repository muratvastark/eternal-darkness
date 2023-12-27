import { EmbedBuilder, inlineCode, TextChannel, bold, PermissionFlagsBits } from 'discord.js';
import { UserModel } from '@/models';
import { LimitFlags, NameFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { ICommand } from '@/types';

const Name: ICommand = {
    usages: ['name', 'isim'],
    description: 'Belirtilen kullanıcının ismini değiştirirsiniz!',
    usableAuth: ['1179554150351122432', '1179554153362628669', '1179403561747095552', '1179030512573091930'],
    execute: async ({ client, message, args }) => {
        const reference = message.reference ? (await message.fetchReference()).member : undefined;
        const member = (await MemberManager.getMember(message.guild, args[0])) || reference;
        if (!member) {
            client.utils.sendTimedMessage(message, 'Sunucuda bulunan geçerli birini belirtmelisin.');
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

        const limit = MemberManager.checkLimit(
            message.author.id,
            LimitFlags.Name,
            message.member.roles.cache.has('1179403561747095552') ? 15 : 10,
            1000 * 60 * 10,
        );
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum ban limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        let newName = `∙ ${name} | ${age}`;
        if (client.config.SERVER.TAGGED_SERVER) {
            const hasTag = member.user.displayName.includes(client.config.SERVER.TAG);
            newName = `${hasTag ? client.config.SERVER.TAG : client.config.SERVER.UNTAGGED_TAG} ${name} | ${age}`;
        }

        await member.setNickname(newName);
        await UserModel.updateOne(
            { id: member.id },
            { $push: { names: { admin: message.author.id, type: NameFlags.ChangeName, timestamp: Date.now(), name } } },
            { upsert: true },
        );

        const registerLogChannel = message.guild.channels.cache.find((c) => c.name === 'register-log') as TextChannel;
        if (registerLogChannel) {
            registerLogChannel.send({
                content: `${member} (${inlineCode(member.id.toString())}) adlı kullanıcının ismi ${
                    message.author
                } (${inlineCode(message.author.username)}) tarafından değiştirildi.`,
            });
        }

        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    description: `${member} üyesinin ismi başarıyla ${bold(`${name} | ${age}`)} değiştirildi.`,
                }),
            ],
        });
    },
};

export default Name;

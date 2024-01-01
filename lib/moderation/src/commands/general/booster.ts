import { LimitFlags, NameFlags } from '@/enums';
import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import { bold } from 'discord.js';

const inviteRegex =
    /\b(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discordapp\.com\/invite)\/([a-zA-Z0-9\-]{2,32})\b/;
const adsRegex = /([^a-zA-ZIıİiÜüĞğŞşÖöÇç\s])+/gi;

const Booster: ICommand = {
    usages: ['bisim', 'booster', 'b', 'zengin'],
    description: 'Boost basan üyeler nicklerini değiştirir.',
    execute: async ({ client, message, args }) => {
        if (!message.member.premiumSinceTimestamp) return;

        const name = args.join(' ');
        if (!name.length) return client.utils.sendTimedMessage(message, 'Geçerli bir isim belirt!');

        if (name.match(adsRegex)) {
            client.utils.sendTimedMessage(
                message,
                'Belirttiğin kullanıcı adında özel harflerin bulunmaması gerekiyor!',
            );
            return;
        }

        if (inviteRegex.test(name)) {
            message.delete();
            client.utils.sendTimedMessage(message, 'Reklam yapmasak mı?');
            return;
        }

        const limit = MemberManager.checkLimit(message.author.id, LimitFlags.Boost);
        if (limit.hasLimit) {
            client.utils.sendTimedMessage(
                message,
                `Atabileceğiniz maksimum kayıtsız limitine ulaştınız. Komutu tekrar kullanabilmek için ${limit.time}.`,
            );
            return;
        }

        let newName = name;
        if (client.config.SERVER.TAGGED_SERVER) {
            const hasTag = message.author.displayName.includes(client.config.SERVER.TAG);
            newName = `${hasTag ? client.config.SERVER.TAG : client.config.SERVER.UNTAGGED_TAG} ${name}`;
        }

        if (newName.length > 30) {
            client.utils.sendTimedMessage(message, '30 karakteri geçmeyecek bir isim belirt.');
            return;
        }

        message.member.setNickname(newName);

        message.reply(`ismin "${bold(newName)}" olarak değiştirildi.`);

        await UserModel.updateOne(
            { id: message.author.id },
            { $push: { names: { type: NameFlags.Booster, timestamp: Date.now(), name } } },
            { upsert: true },
        );
    },
};

export default Booster;

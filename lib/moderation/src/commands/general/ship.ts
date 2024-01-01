import { MemberManager } from '@/managers';
import { ICommand } from '@/types';
import { Canvas, loadImage } from 'canvas-constructor/skia';
import { AttachmentBuilder, EmbedBuilder, bold, formatEmoji, resolveColor } from 'discord.js';
import random from 'random-number-csprng';

const Ship: ICommand = {
    usages: ['ship'],
    description: 'Shipler işte.',
    usableChannels: ['1182326753201496114'],
    execute: async ({ client, message, args }) => {
        let target = await MemberManager.getUser(client, args[0]);

        if (target && target.bot) {
            client.utils.sendTimedMessage(message, 'Botlarla olan ilişkini ölçemezsin!');
            return;
        }

        if (target && target.id === message.author.id) {
            client.utils.sendTimedMessage(message, 'O kadar mı yalnızsın agam :c');
            return;
        }

        if (target && target.id === '1158378706444767232') {
            message.channel.send('aşk meşk yok only biznis');
            return;
        }

        if (target && target.id === '1158396365701910588') {
            message.reply('Çocuk zaten ölmüş bari cennetinde rahatını bozma.');
            return;
        }

        if (!target) {
            const roles = client.config.SERVER.MAN_ROLES.some((r) => message.member.roles.cache.has(r))
                ? client.config.SERVER.WOMAN_ROLES
                : client.config.SERVER.MAN_ROLES;
            target = message.guild.members.cache
                .filter((m) => roles.some((x) => m.roles.cache.has(x)) && !m.user.bot)
                .random().user;
        }

        const percent = await random(15, 100);
        const canvas = new Canvas(691, 244);

        canvas.setColor('#3c3c3c');
        canvas.printRoundedRectangle(0, 0, canvas.width, canvas.height, 10);

        canvas.setColor('#e31b23');
        canvas.printRectangle(263, 194, 167, -((percent / 100) * 147));

        const backgroundBuffer = await loadImage('./src/assets/ship.png');
        canvas.printImage(backgroundBuffer, 0, 0);

        const authorAvatarBuffer = await loadImage(message.author.displayAvatarURL({ extension: 'png', size: 4096 }));
        const targetAvatarBuffer = await loadImage(target.displayAvatarURL({ extension: 'png', size: 4096 }));
        canvas.printRoundedImage(authorAvatarBuffer, 42, 38, 170, 170, 25);
        canvas.printRoundedImage(targetAvatarBuffer, 480, 38, 170, 170, 25);

        canvas.setColor('#ffffff');
        canvas.setTextAlign('center');
        canvas.setTextFont('normal 42px Kanit');
        canvas.printText(`%${percent}`, 348, 130);

        const attachment = new AttachmentBuilder(canvas.png(), { name: 'ship.png' });
        message.reply({
            content: `${message.author} ${target}`,
            embeds: [
                new EmbedBuilder({
                    color: resolveColor('#1a1a1a'),
                    description: `## ${formatEmoji('1181241136740847677')} ${message.author.displayName} & ${
                        target.displayName
                    }\n${bold(createContent((percent * 100) / 100))}`,
                    image: {
                        url: 'attachment://ship.png',
                    },
                }),
            ],
            files: [attachment],
            allowedMentions: { parse: [], repliedUser: true },
            flags: [4096],
        });
    },
};

export default Ship;

function createContent(num: number) {
    if (num < 10) return 'Bizden olmaz...';
    if (num < 20) return 'Çok farklıyız...';
    if (num < 30) return 'Eksik bir şeyler var...';
    if (num < 40) return 'Sıradan biri gibi...';
    if (num < 50) return 'Aslında hoş biri...';
    if (num < 60) return 'Fena değil...';
    if (num < 70) return "Bi'kahveye ne dersin?";
    if (num < 80) return 'Çiğköfte & milkshake yapalım mı?';
    if (num < 90) return 'Beraber film izleyelim mi?';

    return 'Ev boş?';
}

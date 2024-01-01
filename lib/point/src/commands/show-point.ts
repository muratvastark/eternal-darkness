import { MemberManager, StaffManager } from '@/managers';
import { StaffModel } from '@/models';
import { ICommand } from '@/types';
import { AttachmentBuilder, EmbedBuilder, bold, codeBlock, formatEmoji, inlineCode, resolveColor, time } from 'discord.js';
import { Canvas, loadImage } from 'canvas-constructor/skia';

const calculatePercentage = (partialValue: number, totalValue: number) =>
    partialValue ? Math.floor((100 * partialValue) / totalValue) : 0;

const ShowPoint: ICommand = {
    usages: ['puan', 'point', 'p'],
    description: 'Puanı gösterir.',
    execute: async ({ client, message, args }) => {
        let member = message.member;
        const newArgs = args.join(' ').trim();
        if (newArgs.length) member = await MemberManager.getMember(message.guild, newArgs);

        if (!member) return client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
        if (member.user.bot) return client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı bir bot!');
        if (!StaffManager.checkStaff(member)) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcı yetkili değil!');
            return;
        }

        const document = await StaffModel.findOne({ id: member.id });
        if (!document) {
            client.utils.sendTimedMessage(
                message,
                member.id === message.author.id ? 'Puanın bulunmuyor.' : 'Belirttiğin kullanıcının verisi bulunmuyor.',
            );
            return;
        }

        const { currentRole, newRole } = StaffManager.getRank(member.roles.cache.map((m) => m.id));

        const purpleDotEmoji = formatEmoji('1186244755617747015', true);
        const invitePoints = document.invitedUsers.length * client.config.SERVER.INVITE_POINT;
        const staffTakePoints = document.staffTakes.length * client.config.SERVER.STAFF_TAKE_POINT;
        const embed = new EmbedBuilder({
            color: resolveColor("#1a1a1a"),
            description: [
                `${member} adlı kullanıcının puan ve yüzdelik bilgileri;\n`,
                `${purpleDotEmoji} ${inlineCode(' YETKIYE BAŞLAMA: ')} ${time(
                    Math.floor(document.staffStartTime / 1000),
                    'R',
                )}`,
                `${purpleDotEmoji} ${inlineCode(' ROLE BAŞLAMA: ')} ${time(
                    Math.floor(document.roleStarted / 1000),
                    'R',
                )}`,
                `${purpleDotEmoji} ${inlineCode(' ORYANTASYON DURUMU: ')} ${bold(
                    document.hasOrientation ? 'Verildi.' : 'Verilmedi.',
                )}`,
                `${purpleDotEmoji} ${inlineCode(' BONUS PUAN: ')} ${bold(
                    document.bonusPoints.toString(),
                )} (%${calculatePercentage(document.bonusPoints, document.totalPoints)})\n`,
                `${purpleDotEmoji} ${inlineCode(' DAVET PUAN: ')} ${bold(
                    invitePoints.toString(),
                )} (%${calculatePercentage(invitePoints, document.totalPoints)})`,
                `${purpleDotEmoji} ${inlineCode(' MESAJ PUAN: ')} ${bold(
                    document.messagePoints.toString(),
                )} (%${calculatePercentage(document.messagePoints, document.totalPoints)})`,
                `${purpleDotEmoji} ${inlineCode(' PUBLIC PUAN: ')} ${bold(
                    document.publicPoints.toString(),
                )} (%${calculatePercentage(document.publicPoints, document.totalPoints)})`,
                `${purpleDotEmoji} ${inlineCode(' SORUMLULUK PUAN: ')} ${bold(
                    document.responsibilityPoints.toString(),
                )} (%${calculatePercentage(document.responsibilityPoints, document.totalPoints)})\n`,
                `${purpleDotEmoji} ${inlineCode(' YETKILI ALMA: ')} ${bold(
                    staffTakePoints.toString(),
                )} (%${calculatePercentage(staffTakePoints, document.totalPoints)})`,
                `${purpleDotEmoji} ${inlineCode(' ORYANTASYON PUAN: ')} ${bold(
                    document.orientationPoints.toString(),
                )} (%${calculatePercentage(document.orientationPoints, document.totalPoints)})`,
                `${purpleDotEmoji} ${inlineCode(' KAYIT PUAN: ')} ${bold(
                    document.registerPoints.toString(),
                )} (%${calculatePercentage(document.registerPoints, document.totalPoints)})`,
                `${purpleDotEmoji} ${inlineCode(' SORUN ÇÖZME PUAN: ')} ${bold(
                    document.problemResolvePoints.toString(),
                )} (%${calculatePercentage(document.problemResolvePoints, document.totalPoints)})`,
                `${purpleDotEmoji} ${inlineCode(' DIGER PUAN: ')} ${bold(
                    document.otherPoints.toString(),
                )} (%${calculatePercentage(document.otherPoints, document.totalPoints)} | Max: ${
                    currentRole.POINT / 2
                })\n`,
                codeBlock(
                    "ansi",
                    `[2;35m${currentRole.MUST_PUBLIC ? 'Public seste durma ve ' : ''}${
                        currentRole.REQUIRED_TASKS
                    } adet görev yapma zorunluğundasın.[0m`,
                ),
            ].join('\n'),
            image: {
                url: 'attachment://point-card.png',
            },
        });

        if (!newRole) embed.setFooter({ text: 'Son yetkidesiniz!' });

        const roleStartTime = new Date(document.roleStarted);
        const now = new Date();
        roleStartTime.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        const requiredPoints = currentRole ? currentRole.POINT : 99999999;
        const completedDayCount = Math.abs(now.getTime() - roleStartTime.getTime()) / (1000 * 60 * 60 * 24);
        const requiredDayCount = parseInt(currentRole.REQUIRED_DAYS);
        const avatarBuffer = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 1024 }));
        const backgroundBuffer = await loadImage('./src/assets/point-card.png');
        const canvas = new Canvas(494, 166);

        canvas.printImage(backgroundBuffer, 0, 0);

        canvas.printRoundedImage(avatarBuffer, 10, 10, 145, 145, 25);

        canvas.setColor('#ffffff');
        canvas.setTextFont('normal 16px Kanit');
        canvas.printText(member.user.displayName, 286, 37);
        canvas.printText(message.guild.roles.cache.get(currentRole.ID).name, 286, 67);

        const boxes = [];
        if (requiredDayCount > 7) {
            for (let day = 1; day < 4; day++) {
                const isCompleted = completedDayCount >= day;
                boxes.push({ day, completed: isCompleted });
            }

            boxes.push(
                ...[
                    { day: Math.min((4 >= completedDayCount ? 4 : completedDayCount), requiredDayCount - 3), completed: completedDayCount >= 4 },
                    { day: requiredDayCount - 2, completed: completedDayCount >= requiredDayCount - 2 },
                    { day: requiredDayCount - 1, completed: completedDayCount >= requiredDayCount - 1 },
                    { day: requiredDayCount, completed: completedDayCount >= requiredDayCount },
                ],
            );
        } else {
            for (let day = 1; day < requiredDayCount + 1; day++) {
                const isCompleted = completedDayCount >= day;
                boxes.push({ day, completed: isCompleted });
            }
        }

        for (let i = 0; (requiredDayCount >= 7 ? 7 : requiredDayCount) > i; i++) {
            const box = boxes[i];
            canvas.setColor((box.day === completedDayCount || (completedDayCount === 0 && box.day === 1)) ? '#10b981' : box.completed ? '#8e59ff' : '#1a1a1a');
            canvas.printRoundedRectangle(285 + i * 27, 85, 14, 14, 5);
            canvas.setTextFont('normal 12px Kanit');
            canvas.setColor('#ffffff');
            canvas.setTextAlign('center');
            canvas.printResponsiveText(`${box.day}`, 292 + i * 27, 96, 10);
        }

        canvas.setColor('#3c3c3c');
        canvas.printRoundedRectangle(175, 130, 300, 16, 5);

        canvas.setColor(message.member.displayHexColor);
        canvas.printRoundedRectangle(
            175,
            130,
            StaffManager.getProgressWidth(document.totalPoints, requiredPoints, 300, 25),
            16,
            5,
        );

        canvas.setTextFont('normal 14px Kanit');
        canvas.setColor('#7f8384');
        canvas.setTextAlign('right');
        canvas.printText(`/ ${StaffManager.shortNumber(requiredPoints)}`, 472, 124);

        canvas.setColor('#ffffff');
        const requiredWidth = canvas.measureText(`/ ${StaffManager.shortNumber(requiredPoints)}`).width;
        canvas.printText(`${StaffManager.shortNumber(document.totalPoints)}`, 468 - requiredWidth, 124);

        const attachment = new AttachmentBuilder(canvas.png(), { name: 'point-card.png' });
        message.channel.send({ embeds: [embed], files: [attachment] });
    },
};

export default ShowPoint;

import { UserModel } from '@/models';
import { MemberManager, StatManager } from '@/managers';
import { Canvas, loadImage } from 'canvas-constructor/skia';
import { AttachmentBuilder } from 'discord.js';
import { ICommand } from '@/types';

const VoiceLevel: ICommand = {
    usages: ['seslevel'],
    description: 'Kullanıcının ses seviyesini gösterir.',
    execute: async ({ client, message, args }) => {
        const user = args.length ? await MemberManager.getUser(client, args[0]) : message.author;

        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (user.bot) {
            client.utils.sendTimedMessage(message, 'Botların verisi bulunamaz!');
            return;
        }

        const document = await UserModel.findOne({ id: user.id }).select('voiceLevel voiceXP');
        if (!document) {
            client.utils.sendTimedMessage(message, 'Veri bulunmuyor.');
            return;
        }
        const avatarBuffer = await loadImage(user.displayAvatarURL({ extension: 'png', size: 1024 }));
        const requiredXP = StatManager.getRequiredXP(document.voiceLevel);
        const canvas = new Canvas(912, 244);

        canvas.setColor('#111111');
        canvas.printRoundedRectangle(0, 0, canvas.width, canvas.height, 10);

        canvas.setColor('#1a1a1a');
        canvas.printRoundedRectangle(17, 19, 878, 208, 5);

        canvas.printRoundedImage(avatarBuffer, 42, 38, 170, 170, 25);

        canvas.setColor('#3c3c3c');
        canvas.printRoundedRectangle(232, 153, 638, 30, 10);

        canvas.setColor('#208edd');
        canvas.printRoundedRectangle(
            232,
            153,
            StatManager.getProgressWidth(document.voiceXP, requiredXP, 638, 100),
            30,
            10,
        );

        canvas.setColor('#ffffff');
        canvas.setTextFont('normal 35px Kanit');
        canvas.printText(user.displayName, 232, 133);

        canvas.setTextFont('normal 20px Kanit');
        canvas.setColor('#7f8384');
        canvas.setTextAlign('right');
        canvas.printText(`/ ${StatManager.shortNumber(requiredXP)} XP`, 866, 133);

        canvas.setColor('#ffffff');

        const requiredWidth = canvas.measureText(`/ ${StatManager.shortNumber(requiredXP)} XP`).width;
        canvas.printText(`${StatManager.shortNumber(document.voiceXP)}`, 857 - requiredWidth, 133);

        canvas.setTextFont('normal 40px Kanit');
        canvas.printText(document.voiceLevel.toString(), 870, 68);

        const levelWidth = canvas.measureText(document.voiceLevel.toString()).width;
        canvas.setTextFont('normal 20px Kanit');
        canvas.setColor('#2787ce');
        canvas.printText('SES LEVEL', 862 - levelWidth, 68);

        const attachment = new AttachmentBuilder(canvas.png(), { name: 'voice-level.png' });
        message.channel.send({ files: [attachment] });
    },
};

export default VoiceLevel;

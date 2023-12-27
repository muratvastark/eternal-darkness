import { Client } from '@/base';
import { IStats } from '@/types';
import { AttachmentBuilder } from 'discord.js';
import { Canvas, loadImage } from 'canvas-constructor/skia';
import { MemberManager, StatManager } from '@/managers';

const titles = {
    voices: 'En Fazla Seste Duran Kullanıcılar',
    messages: 'En Fazla Mesaj Atan Kullanıcılar',
    streams: 'En Fazla Yayın Açan Kullanıcılar',
    cameras: 'En Fazla Kamera Açan Kullanıcılar',
};

const specialColors = {
    0: '#ffd700',
    1: '#19ed8c',
    2: '#ed194d',
};

export default async function getTopCanvas(client: Client, type: string, datas: IStats[], page: number) {
    const canvas = new Canvas(1280, 540);

    canvas.setColor('#111111');
    canvas.printRoundedRectangle(0, 0, canvas.width, canvas.height, 20);

    canvas.setTextAlign('center');
    canvas.setColor("#ffffff")
    canvas.setTextFont('normal 30px Kanit');
    canvas.printText(titles[type].toUpperCase(), 640, 50);

    for (let i = 0; i < datas.length; i++) {
        const data = datas[i];
        const newIndex = 5 > i ? i : i - 5;
        const user = await MemberManager.getUser(client, data.id);
        const avatar = await loadImage(user.displayAvatarURL({ size: 4096, extension: 'png' }));
        const valueString = type === 'messages' ? `${data.total} mesaj` : client.utils.numberToString(data.total);

        canvas.setTextAlign('left');

        const cardX = 5 > i ? 20 : 650;
        const cardY = 90 + 20 * newIndex + 70 * newIndex;
        canvas.setColor('#1a1a1a');
        canvas.printRoundedRectangle(cardX, cardY, 612, 70, 20);

        canvas.setColor('#ffffff');

        const avatarX = 5 > i ? 65 : 690;
        const avatarY = 125 + 90 * newIndex;
        canvas.printCircularImage(avatar, avatarX, avatarY, 30);

        const nameX = 5 > i ? 105 : 735;
        const nameY = 124 + 90 * newIndex;
        canvas.setTextFont('normal 22px Kanit');
        canvas.setTextSize(22);
        canvas.printText(user.displayName, nameX, nameY);

        const valueX = 5 > i ? 105 : 735;
        const valueY = 142 + 90 * newIndex;
        canvas.setTextFont('normal 14px Kanit');
        canvas.printText(valueString, valueX, valueY);

        const rankX = 5 > i ? 620 : 1250;
        const rankY = 137 + 90 * newIndex;
        canvas.setTextFont('normal 30px Kanit');
        canvas.setTextAlign('right');
        canvas.setColor(page === 1 && specialColors[i] ? specialColors[i] : '#ffffff');
        canvas.printText(`#${StatManager.shortNumber(i + (page - 1) * 10 + 1)}`, rankX, rankY);
    }

    return new AttachmentBuilder(canvas.png(), { name: 'top.png' });
}

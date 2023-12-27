import { MemberManager } from '@/managers';
import { UserModel } from '@/models';
import { ICommand } from '@/types';
import { EmbedBuilder, bold, formatEmoji, inlineCode } from 'discord.js';

const CameraStatistics: ICommand = {
    usages: ['camstat', 'camstats', 'camerastat', 'camerastats', 'kamerastat', 'kamerastats'],
    description: 'Yayın veri istatistiklerini görüntüler.',
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

        const document = await UserModel.findOne({ id: user.id });
        if (!document || !document.cameras) {
            client.utils.sendTimedMessage(message, 'Veri bulunmuyor.');
            return;
        }

        const argIndex = user.id !== message.author.id ? 1 : 0;
        const wantedDay = args[argIndex] ? Number(args[argIndex]) : document.days;
        if (!wantedDay || 0 >= wantedDay) {
            client.utils.sendTimedMessage(message, 'Geçerli gün sayısı belirt!');
            return;
        }

        if (wantedDay > document.days) {
            client.utils.sendTimedMessage(message, `Kullanıcının ${bold(document.days.toString())} günlük verisi var.`);
            return;
        }

        let voice = 0;
        let count = 0;
        let total = 0;
        Object.keys(document.cameras)
            .filter((d) => wantedDay > document.days - Number(d))
            .forEach((d) => {
                total += document.cameras[d].total;
                count += document.cameras[d].count;
                voice += document.cameras[d].voice;
            });

        const emoji = formatEmoji(client.config.EMOJIS.CAMERA_STAT);
        message.channel.send({
            embeds: [
                new EmbedBuilder({
                    color: client.utils.getRandomColor(),
                    description: [
                        `${bold('Camera Verileri')}\n`,
                        `${user} adlı kullanıcının ${bold(`${wantedDay} günlük`)} ses istatistikleri;\n`,
                        `${emoji} Toplam Kamera Aktifliği: ${inlineCode(client.utils.numberToString(voice))}`,
                        `${emoji} Toplam Kamera Adeti: ${inlineCode(`${count} adet`)}`,
                        `${emoji} Toplam Kamera Süresi: ${inlineCode(client.utils.numberToString(total))}`,
                    ].join('\n'),
                }),
            ],
        });
    },
};

export default CameraStatistics;

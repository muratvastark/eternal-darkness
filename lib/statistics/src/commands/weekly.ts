import { AttachmentBuilder, EmbedBuilder, resolveColor, inlineCode, formatEmoji } from "discord.js";
import { MemberManager } from "@/managers";
import { UserModel } from "@/models";
import { ICommand } from "@/types";
import { Canvas, loadImage } from "canvas-constructor/skia";

const Weekly: ICommand = {
    usages: ["haftalık", "weekly"   ],
    description: "Haftalık bilgileri detaylı şekilde gösterir.",
    execute: async ({ client, message, args }) => {
        const user = args.length
            ? (await MemberManager.getUser(client, args[0])) ||
              (message.reference ? (await message.fetchReference()).author : undefined)
            : message.author;

        if (!user) {
            client.utils.sendTimedMessage(message, 'Geçerli bir kullanıcı belirt!');
            return;
        }

        if (user.bot) {
            client.utils.sendTimedMessage(message, 'Botların verisi bulunamaz!');
            return;
        }

        const document = await UserModel.findOne({ id: user.id });
        if (!document) {
            client.utils.sendTimedMessage(message, 'Belirttiğin kullanıcının verisi bulunmuyor.');
            return;
        }
    
        const canvas = new Canvas(1145, 337);

        const backgroundBuffer = await loadImage('./src/assets/weekly-card.png');
        canvas.printImage(backgroundBuffer, 0, 0);

        const avatarBuffer = await loadImage(user.displayAvatarURL({ extension: 'png', size: 4096 }));
        canvas.printRoundedImage(avatarBuffer, 19, 18, 65, 65, 20);

        canvas.setTextFont('normal 25px Kanit');
        canvas.setColor("#ffffff");
        canvas.printText(user.displayName, 95, 60)

        canvas.setTextSize(20);
        canvas.setTextAlign('center');
        canvas.printText(`${document.days} günlük veri`, 995, 46);

        canvas.setTextSize(15);

        const voiceDays = document.voices || {};
        const monthlyVoice = Object.keys(voiceDays)
            .filter((d) => 30 >= document.days - Number(d))
            .reduce((totalCount, currentDay) => totalCount + voiceDays[currentDay].total, 0);
        const totalVoice = Object.keys(voiceDays).reduce(
            (totalCount, currentDay) => totalCount + voiceDays[currentDay].total,
            0,
        );

        const messageDays = document.messages || {};
        const monthlyMessage = Object.keys(messageDays)
            .filter((d) => 30 >= document.days - Number(d))
            .reduce((totalCount, currentDay) => totalCount + messageDays[currentDay].total, 0);
        const totalMessage = Object.keys(messageDays).reduce(
            (totalCount, currentDay) => totalCount + messageDays[currentDay].total,
            0,
        );

        const streamDays = document.streams || {};
        const monthlyStream = Object.keys(streamDays)
            .filter((d) => 30 >= document.days - Number(d))
            .reduce((totalCount, currentDay) => totalCount + streamDays[currentDay].total, 0);
        const totalStream = Object.keys(streamDays).reduce(
            (totalCount, currentDay) => totalCount + streamDays[currentDay].total,
            0,
        );

        const cameraDays = document.cameras || {};
        const monthlyCamera = Object.keys(cameraDays)
            .filter((d) => 30 >= document.days - Number(d))
            .reduce((totalCount, currentDay) => totalCount + cameraDays[currentDay].total, 0);
        const totalCamera = Object.keys(cameraDays).reduce(
            (totalCount, currentDay) => totalCount + cameraDays[currentDay].total,
            0,
        );

        let chatMessages = 0;
        Object.keys(messageDays)
            .filter((d) => 7 >= document.days - Number(d))
            .forEach((day) => {
                if (messageDays[day]["1180836843659460658"]) chatMessages += messageDays[day]["1180836843659460658"];
            });

        let publicVoice = 0, 
            camVoice = 0, 
            streamVoice = 0, 
            fortuneVoice = 0, 
            threapyVoice = 0, 
            gameVoice = 0, 
            registerVoice = 0, 
            staffTakeVoice = 0, 
            orientationVoice = 0,
            problemVoice = 0,
            afkVoice = 0;
        Object.keys(voiceDays)
            .filter((d) => 7 >= document.days - Number(d))
            .forEach((day) => {
                Object.keys(voiceDays[day]).forEach(id => {
                    if (id === "total") return;

                    const channel = message.guild.channels.cache.get(id);
                    if (!channel || ["1179535471035031552", "1180707267524427796"].includes(channel.id)) {
                        afkVoice += voiceDays[day][id];
                        return;
                    }

                    if (channel.parentId === "1179879314834063500") {
                        problemVoice += voiceDays[day][id];
                        return;
                    }

                    if (channel.parentId === "1179412197768695948") {
                        publicVoice += voiceDays[day][id];
                        return;
                    }

                    if (channel.parentId === "1180606820646137856") {
                        gameVoice += voiceDays[day][id];
                        return;
                    }

                    if (channel.parentId === "1179796434854363167") {
                        registerVoice += voiceDays[day][id];
                        return;
                    }

                    if (["1179805862567616512", "1179805838928519178", "1179805800747769979", "1179805798541565983", "1179805778538922045","1179805116245749822", "1179805687027597352", "1179805709362286622", "1179805732888125512", "1179805759480025218"].includes(channel.id)) {
                        streamVoice += voiceDays[day][id];
                        return;
                    }

                    if (channel.parentId === "1180859625998913616") {
                        staffTakeVoice += voiceDays[day][id];
                        return;
                    }

                    if (channel.parentId === "1182833122442760252" && channel.id !== "1182837923012419696") {
                        orientationVoice += voiceDays[day][id];
                        return;
                    }

                    if (["1179807054890799175", "1179807105876754503"].includes(channel.id)) {
                        camVoice += voiceDays[day][id];
                        return;
                    }

                    if (["1181693425217704106", "1181693437444100116", "1181693450823942214"].includes(channel.id)) {
                        threapyVoice += voiceDays[day][id];
                        return;
                    }

                    if (["1181693474995716186", "1181693492997660703", "1181693508936007720"].includes(channel.id)) {
                        fortuneVoice += voiceDays[day][id];
                        return;
                    }

                    afkVoice += voiceDays[day][id];
                });
            });
    
        canvas.printText(client.utils.numberToString((voiceDays[document.days] || { total: 0 }).total), 258, 143);
        canvas.printText(`${(messageDays[document.days]|| { total: 0 }).total} mesaj`, 258, 195);
        canvas.printText(client.utils.numberToString((streamDays[document.days]|| { total: 0 }).total), 258, 243);
        canvas.printText(client.utils.numberToString((cameraDays[document.days] || { total: 0 }).total), 258, 293);

        canvas.printText(client.utils.numberToString(monthlyVoice || 0), 639, 143);
        canvas.printText(`${monthlyMessage} mesaj`, 639, 195);
        canvas.printText(client.utils.numberToString(monthlyStream || 0), 639, 243);
        canvas.printText(client.utils.numberToString(monthlyCamera || 0), 639, 293);

        canvas.printText(client.utils.numberToString(totalVoice || 0), 1018, 143);
        canvas.printText(`${totalMessage} mesaj`, 1018, 195);
        canvas.printText(client.utils.numberToString(totalStream || 0), 1018, 243);
        canvas.printText(client.utils.numberToString(totalCamera || 0), 1018, 293);

        const attachment = new AttachmentBuilder(canvas.png(), { name: 'weekly-stats.png' });
        const emoji = formatEmoji("1186244755617747015", true);
        message.channel.send({ 
            embeds: [
                new EmbedBuilder({
                    color: resolveColor("#1a1a1a"),
                    description: `${user} (${inlineCode(user.id)}) adlı kullanıcının haftalık istatistik tablosu;`,
                    fields: [
                        {
                            name: "Haftalık Eternal Chat İstatistiği",
                            value: inlineCode(` ${chatMessages} mesaj `)
                        },
                        {
                            name: "Haftalık Ses İstatistikleri",
                            value: [
                                `${emoji} Public Kanallar: ${inlineCode(` ${client.utils.numberToString(publicVoice).trimEnd()} `)}`,
                                `${emoji} Kamera Odaları: ${inlineCode(` ${client.utils.numberToString(camVoice).trimEnd()} `)}`,
                                `${emoji} Yayın Odaları: ${inlineCode(` ${client.utils.numberToString(streamVoice).trimEnd()} `)}`,
                                `${emoji} Fal Kanalları: ${inlineCode(` ${client.utils.numberToString(fortuneVoice).trimEnd()} `)}`,
                                `${emoji} Terapi Kanalları: ${inlineCode(` ${client.utils.numberToString(threapyVoice).trimEnd()} `)}`,
                                `${emoji} Oyun Kanalları: ${inlineCode(` ${client.utils.numberToString(gameVoice).trimEnd()} `)}`,
                                `${emoji} Kayıt Kanalları: ${inlineCode(` ${client.utils.numberToString(registerVoice).trimEnd()} `)}   ` ,
                                `${emoji} Yetkili Alım Kanalları: ${inlineCode(` ${client.utils.numberToString(staffTakeVoice).trimEnd()} `)}`,
                                `${emoji} Oryantasyon Kanalları: ${inlineCode(` ${client.utils.numberToString(orientationVoice).trimEnd()} `)}`,
                                `${emoji} Sorun Çözme Kanalları: ${inlineCode(` ${client.utils.numberToString(problemVoice).trimEnd()} `)}`,
                                `${emoji} Afk Sayılan Kanalları: ${inlineCode(` ${client.utils.numberToString(afkVoice).trimEnd()} `)}`
                            ].join("\n")
                        }
                    ],
                    image: {
                        url: "attachment://weekly-stats.png"
                    }
                })
            ],
            files: [attachment] 
        });
    }
}

export default Weekly;

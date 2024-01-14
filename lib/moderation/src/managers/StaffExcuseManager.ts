import { StaffExcuseModel } from "@/models";
import { Guild, TextChannel, EmbedBuilder, Colors, userMention, time } from 'discord.js';

export class StaffExcuseManager {
    static excuses: { staffId: string; finishTimestamp: number }[] = [];

    static async init() {
        const excuses = await StaffExcuseModel.find();
        StaffExcuseManager.excuses = excuses.map(({ finishTimestamp, staffId }) => ({ finishTimestamp, staffId }));
    }

    static async checkExcuses(guild: Guild) {
        const finishedExcuses = await StaffExcuseModel.find({
            finishTimestamp: { $lte: Date.now() },
            activity: false
        });
        const embed = new EmbedBuilder({ color: Colors.Red });
        const channel = guild.channels.cache.find(c => c.name === "mazeret") as TextChannel;
        for (const finishedExcuse of finishedExcuses) {
            channel.send({
                embeds: [
                    embed.setDescription([
                        `${userMention(finishedExcuse.staffId)} adlı yetkilinin mazereti bitti.\n`,
                        `Mazeret Başlangıç: ${time(Math.floor(finishedExcuse.createdTimestamp / 1000), "R")} (${time(Math.floor(finishedExcuse.createdTimestamp / 1000), "f")})`,
                        `Mazeret Bitiş: ${time(Math.floor(finishedExcuse.finishTimestamp / 1000), "R")} (${time(Math.floor(finishedExcuse.finishTimestamp / 1000), "f")})`,
                        `Mazeret Sebebi: ${finishedExcuse.reason}`
                    ].join("\n"))
                ]
            });

            StaffExcuseManager.excuses = StaffExcuseManager.excuses.filter(({ finishTimestamp, staffId }) => 
                finishTimestamp !== finishedExcuse.finishTimestamp && staffId !== finishedExcuse.staffId
            );
            finishedExcuse.activity = false;
            finishedExcuse.save();
        }
    }
}

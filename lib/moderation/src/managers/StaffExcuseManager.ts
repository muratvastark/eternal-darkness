import { StaffExcuseModel } from "@/models";
import { Guild, TextChannel, EmbedBuilder, Colors, userMention } from 'discord.js';

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
                    embed.setDescription(`${userMention(finishedExcuse.staffId)} adlı yetkilinin mazereti bitti.\nMazeret Sebebi: ${finishedExcuse.reason}`)
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

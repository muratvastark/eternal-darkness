import { EmbedBuilder, bold, time, TextChannel, inlineCode, Colors } from "discord.js";
import { MemberManager } from "@/managers";
import { StaffExcuseModel } from "@/models";
import { ICommand } from "@/types";
import ms from "ms";

const Excuse: ICommand = {
    usages: ["excuse", "mazeret"],
    description: "Yetkili için mazeret oluşturursun.",
    usableAuth: [],
    execute: async ({ client, message, args }) => {
        const member = await MemberManager.getMember(message.guild, args[0]);
        if (!member) {
            client.utils.sendTimedMessage(message, "Geçerli bir üye belirt!");
            return;
        }

        const minStaffRole = message.guild.roles.cache.get(client.config.SERVER.BOT_COMMAND_ROLE);
        if (!minStaffRole) return;

        if (minStaffRole.position > member.roles.highest.position) {
            client.utils.sendTimedMessage(message, "Geçerli bir yetkili belirt!");
            return;
        }

        const hasExcuse = await StaffExcuseModel.exists({ staffId: member.id, activity: true });
        if (hasExcuse) {
            client.utils.sendTimedMessage(message, "Adamın zaten mazereti var mk!");
            return;
        }

        const timing = ms(args[1]);
        if (!timing) {
            client.utils.sendTimedMessage(message, "Geçerli bir zaman belirt!");
            return;
        }

        const reason = args.slice(2).join(" ");
        if (!reason.length || 4 > reason.length) {
            client.utils.sendTimedMessage(message, "Geçerli bir sebep belirt!");
            return;
        }

        const now = Date.now();
        const embed = new EmbedBuilder({ color: client.utils.getRandomColor() });

        message.channel.send({
            embeds: [
                embed.setDescription(`${member} adlı yetkili ${bold(reason)} sebebiyle ${time(Math.floor((now + timing) / 1000), "R")} süre boyunca mazeretli sayılacak.`)
            ]
        });

        const channel = message.guild.channels.cache.get("1182743127631597758") as TextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    embed.setColor(Colors.Green).setDescription([
                        `${member} (${inlineCode(member.id)}) adlı yetkilinin mazereti eklendi.\n`,
                        `Mazeret Ekleyen Yetkili: ${message.author} (${inlineCode(message.author.id)})`,
                        `Mazeret Başlangıç: ${time(Math.floor(now / 1000), "f")} (${time(Math.floor(now / 1000), "R")})`,
                        `Mazeret Bitiş: ${time(Math.floor((now + timing) / 1000), "f")} (${time(Math.floor((now + timing) / 1000), "R")})`,
                        `Mazeret Sebebi: ${reason}`
                    ].join("\n"))
                ]
            })
        }

        await StaffExcuseModel.create({
            activity: true,
            adminId: message.author.id,
            createdTimestamp: now,
            finishTimestamp: now + timing,
            reason,
            staffId: member.id
        });
    }
}

export default Excuse;

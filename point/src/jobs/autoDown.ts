import { MemberManager, StaffManager } from '@/managers';
import { StaffModel } from '@/models';
import { Colors, EmbedBuilder, Guild, TextChannel, inlineCode, roleMention } from 'discord.js';
import { schedule } from 'node-cron';
import config from '../../config.json';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function autoDown(guild: Guild) {
    schedule('0 0 0 * * 7', async () => {
        const minStaffRole = guild.roles.cache.get(config.SERVER.MIN_STAFF_ROLE);
        if (!minStaffRole) return;

        const now = Date.now();
        const sortedRoles = config.SERVER.RANKS.sort((a, b) => a.POINT - b.POINT);
        const channel = guild.channels.cache.find((c) => c.name === 'yetkisi-çekilenler') as TextChannel;

        const documents = await StaffModel.find({
            $or: [{ roleStarted: { $gte: now + ONE_DAY * 3 } }, { staffStartTime: { $gte: now + ONE_DAY * 7 } }],
        });
        for (const document of documents) {
            const member = await MemberManager.getMember(guild, document.id);
            if (!member) continue;

            const { currentRole, currentIndex } = StaffManager.getRank(member.roles.cache.map((r) => r.id));
            if (!currentRole) continue;

            if (document.lastWeekPoints !== 0 && 3000 > document.allPoints - document.lastWeekPoints) {
                if (currentIndex !== 0) {
                    document.oldRoles.push({ roles: [], timestamp: now });
                    await document.save();

                    await member.roles.remove(
                        member.roles.cache.filter((r) => r.position >= minStaffRole.position).map((r) => r.id),
                    );

                    if (channel) {
                        channel.send({
                            embeds: [
                                new EmbedBuilder({
                                    color: Colors.Red,
                                    description: `${member} (${inlineCode(
                                        member.id,
                                    )}) adlı yetkili haftalık zorunlu puanını yapmadığı ve en alt rolde olduğu için yetkiden atıldı.`,
                                }),
                            ],
                        });
                    }
                    continue;
                }

                const newRole = sortedRoles[currentIndex - 1];

                if (newRole.EXTRA_ROLE && currentRole.EXTRA_ROLE !== newRole.EXTRA_ROLE) {
                    await member.roles.add(newRole.EXTRA_ROLE);
                    await member.roles.remove(currentRole.EXTRA_ROLE);
                }

                await member.roles.remove(currentRole);
                await member.roles.add(newRole.ID);

                if (channel) {
                    channel.send({
                        embeds: [
                            new EmbedBuilder({
                                color: Colors.Red,
                                description: `${member} (${inlineCode(
                                    member.id,
                                )}) adlı kullanıcı haftalık zorunlu puanını yapmadığı için ${currentRole} (${inlineCode(
                                    currentRole.id,
                                )}) rolünden ${roleMention(newRole.ID)} (${inlineCode(newRole.ID)}) rolüne düşürüldü.`,
                            }),
                        ],
                    });
                }

                document.oldRoles.push({
                    roles: [currentRole.ID],
                    timestamp: now,
                });
                document.invitedUsers = [];
                document.messagePoints = 0;
                document.totalPoints = 0;
                document.otherPoints = 0;
                document.publicPoints = 0;
                document.responsibilityPoints = 0;
                document.bonusPoints = 0;
                document.roleStarted = now;
                document.registerPoints = 0;
                document.problemResolvePoints = 0;
                document.orientationPoints = 0;
                document.tasks = [];
                document.staffTakes = [];
            }

            document.lastWeekPoints = document.allPoints;
            await document.save();
        }
    });
}

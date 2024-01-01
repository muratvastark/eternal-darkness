import { MemberManager } from '@/managers';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ModalActionRowComponentBuilder, ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle, codeBlock, roleMention } from 'discord.js';

const cooldowns = new Set();

async function appealStaff(interaction: ButtonInteraction) {
    if (cooldowns.has(interaction.user.id)) {
        interaction.reply({
            content: "Önceden başvuru yapmışsınız.",
            ephemeral: true
        });
        return;
    }

    const oneRow = new ActionRowBuilder<ModalActionRowComponentBuilder>({
        components: [
            new TextInputBuilder({
                custom_id: "first-question",
                label: "İlk Soru",
                placeholder: "Günde kaç saat aktifsin?",
                maxLength: 100,
                style: TextInputStyle.Paragraph,
                required: true
            })
        ]
    });

    const twoRow = new ActionRowBuilder<ModalActionRowComponentBuilder>({
        components: [
            new TextInputBuilder({
                custom_id: "second-question",
                label: "İkinci Soru",
                placeholder: "Sence sunucumuza ne gibi katkıda bulunabilirsin?",
                maxLength: 100,
                style: TextInputStyle.Paragraph,
                required: true
            })
        ]
    });

    const threeRow = new ActionRowBuilder<ModalActionRowComponentBuilder>({
        components: [
            new TextInputBuilder({
                custom_id: "third-question",
                label: "Üçüncü Soru",
                placeholder: "Yetki konusunda en etkili olduğun alan nedir?",
                maxLength: 300,
                style: TextInputStyle.Paragraph,
                required: true
            })
        ]
    });

    const fourRow = new ActionRowBuilder<ModalActionRowComponentBuilder>({
        components: [
            new TextInputBuilder({
                custom_id: "forth-question",
                label: "Dördüncü Soru",
                placeholder: "Başka bir sunucu da yetkili oldun mu? Hangi sunucularda yetkili oldun? Ne kadar süre yetkili kaldın?",
                maxLength: 300,
                style: TextInputStyle.Paragraph,
                required: true
            })
        ]
    });

    const fiveRow = new ActionRowBuilder<ModalActionRowComponentBuilder>({
        components: [
            new TextInputBuilder({
                custom_id: "fiveth-question",
                label: "Beşinci Soru",
                placeholder: "Sese kullanıcı geliyor başka kullanıcıya küfür ediyor, küfredilen de ona küfür ediyor. Ne yaparsın?",
                maxLength: 300,
                style: TextInputStyle.Paragraph,
                required: true
            })
        ]
    });

    await interaction.showModal(
        new ModalBuilder({
            custom_id: "staff-appeal-modal",
            title: "Yetkili Başvuru",
            components: [oneRow, twoRow, threeRow, fourRow, fiveRow]
        })
    );

    const modalCollected = await interaction.awaitModalSubmit({ time: 1000 * 60 * 5 });
    if (modalCollected) {
        cooldowns.add(interaction.user.id);

        modalCollected.reply({
            content: "Başurunuz başarılı şekilde alındı.",
            ephemeral: true
        });

        const channel = interaction.guild.channels.cache.get("1182071728281755658") as TextChannel;
        if (!channel) return;

        const firstAnswer = modalCollected.fields.getTextInputValue("first-question");
        const secondAnswer = modalCollected.fields.getTextInputValue("second-question");
        const thirdAnswer = modalCollected.fields.getTextInputValue("third-question");
        const forthAnswer = modalCollected.fields.getTextInputValue("forth-question");
        const fivethAnswer = modalCollected.fields.getTextInputValue("fiveth-question");

        const member = await MemberManager.getMember(interaction.guild, interaction.user.id);

        channel.send({
            content: [
                `${roleMention("1179566321189531770")} ${roleMention("1181651887238430820")}`,
                codeBlock("ansi", [
                    `[2;31mKullanıcı Adı: ${member.displayName} (${interaction.user.displayName})[0m`,
                    `[2;31mKullanıcı ID: ${interaction.user.id}[0m\n`,
                    "[2;37mGünde kaç saat aktifsin?[0m",
                    `[2;36m${firstAnswer}[0m`,
                    "[2;37mSence sunucumuza ne gibi katkıda bulunabilirsin?[0m",
                    `[2;36m${secondAnswer}[0m`,
                    "[2;37mYetki konusunda en etkili olduğun alan nedir?[0m",
                    `[2;36m${thirdAnswer}[0m`,
                    "[2;37mBaşka bir sunucu da yetkili oldun mu? Hangi sunucularda yetkili oldun? Ne kadar süre yetkili kaldın?[0m",
                    `[2;36m${forthAnswer}[0m`,
                    "[2;37mSese kullanıcı geliyor başka kullanıcıya küfür ediyor, küfredilen de ona küfür ediyor. Ne yaparsın?[0m",
                    `[2;36m${fivethAnswer}[0m`
                ].join("\n"))
            ].join("\n"),
            components: [
                new ActionRowBuilder<ButtonBuilder>({
                    components: [
                        new ButtonBuilder({
                            label: "Yetkili Kabul",
                            custom_id: `appeal-accept-${interaction.user.id}`,
                            style: ButtonStyle.Success
                        })
                    ]
                })
            ]
        });
    }
}

export default appealStaff;

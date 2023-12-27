import { UserModel } from '@/models';
import { Client } from '@/base';
import { ButtonInteraction, ComponentType, Message } from 'discord.js';
import getTopCanvas from './getTopCanvas';

async function getPagination(client: Client, question: Message, type: string, authorId: string) {
    const totalData = Math.floor((await UserModel.countDocuments({ [type]: { $exists: true } })) / 10);
    const datas = await UserModel.aggregate([
        {
            $project: {
                id: '$id',
                total: {
                    $reduce: {
                        input: { $objectToArray: `$${type}` },
                        initialValue: 0,
                        in: {
                            $add: ["$$value", "$$this.v.total"]
                        },  
                    },
                },
            },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $project: { id: 1, total: 1 } },
    ]);
    let page = 1;
    await question.edit({
        files: [await getTopCanvas(client, type, datas, page)],
        components: [client.utils.paginationButtons(page, totalData)],
    });

    const filter = (i: ButtonInteraction) => i.user.id === authorId;
    const collector = await question.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 2,
        max: 20,
        componentType: ComponentType.Button,
    });

    collector.on('collect', async (i: ButtonInteraction) => {
        i.deferUpdate();

        if (i.customId === 'first') page = 1;
        else if (i.customId === 'previous') page -= 1;
        else if (i.customId === 'next') page += 1;
        else if (i.customId === 'last') page = totalData;

        const newDatas = await UserModel.aggregate([
            {
                $addFields: {
                    total: {
                        $reduce: {
                            input: { $objectToArray: `$${type}` },
                            initialValue: 0,
                            in: {
                                $sum: '$$this.v.total',
                            },
                        },
                    },
                },
            },
            { $sort: { total: -1 } },
            { $skip: page === 1 ? 0 : (page - 1) * 10 },
            { $limit: 10 },
            { $project: { _id: 0, id: 1, total: 1 } },
        ]);
        await question.edit({
            files: [await getTopCanvas(client, type, newDatas, page)],
            components: [client.utils.paginationButtons(page, totalData)],
        });
    });

    collector.on('end', (_, reason) => {
        if (reason === 'time') question.edit({ components: [client.utils.timesUpButton()] });
    });
}

export default getPagination;

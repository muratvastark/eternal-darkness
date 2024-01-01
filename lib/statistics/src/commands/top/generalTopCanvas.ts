import { UserModel } from '@/models';
import { Client } from '@/base';
import { Canvas, loadImage } from 'canvas-constructor/skia';
import { AttachmentBuilder } from 'discord.js';
import { MemberManager } from '@/managers';

async function generalTopCanvas(client: Client) {
    const topData = await UserModel.aggregate([
        {
            $facet: {
                topVoices: [
                    {
                        $project: {
                            id: '$id',
                            total: {
                                $reduce: {
                                    input: { $objectToArray: "$voices" },
                                    initialValue: 0,
                                    in: {
                                        $add: ["$$value", "$$this.v.total"]
                                    },  
                                },
                            },
                        },
                    },
                    { $sort: { total: -1 } },
                    { $limit: 3 },
                    { $project: { _id: 0, id: 1, total: 1 } },
                ],
                topStreams: [
                    {
                        $project: {
                            id: '$id',
                            total: {
                                $reduce: {
                                    input: { $objectToArray: "$streams" },
                                    initialValue: 0,
                                    in: {
                                        $add: ["$$value", "$$this.v.total"]
                                    },  
                                },
                            },
                        },
                    },
                    { $sort: { total: -1 } },
                    { $limit: 3 },
                    { $project: { _id: 0, id: 1, total: 1 } },
                ],
                topMessages: [
                    {
                        $project: {
                            id: '$id',
                            total: {
                                $reduce: {
                                    input: { $objectToArray: "$messages" },
                                    initialValue: 0,
                                    in: {
                                        $add: ["$$value", "$$this.v.total"]
                                    },  
                                },
                            },
                        },
                    },
                    { $sort: { total: -1 } },
                    { $limit: 3 },
                    { $project: { _id: 0, id: 1, total: 1 } },
                ],
                topCameras: [
                    {
                        $project: {
                            id: '$id',
                            total: {
                                $reduce: {
                                    input: { $objectToArray: "$cameras" },
                                    initialValue: 0,
                                    in: {
                                        $add: ["$$value", "$$this.v.total"]
                                    },  
                                },
                            },
                        },
                    },
                    { $sort: { total: -1 } },
                    { $limit: 3 },
                    { $project: { _id: 0, id: 1, total: 1 } },
                ],
            },
        },
        {
            $project: {
                topVoices: 1,
                topStreams: 1,
                topMessages: 1,
                topCameras: 1,
            },
        },
    ]);
    const backgroundBuffer = await loadImage('./src/assets/top-card.png');
    const canvas = new Canvas(1152, 589);
    canvas.printImage(backgroundBuffer, 0, 0);

    canvas.setTextFont('normal 24px Kanit');
    canvas.setColor('#ffffff');

    const firstColumns = [128, 187, 247];
    const secondColumns = [394, 454, 515];

    for (let i = 0; i < 3; i++) {
        const displayName = (await MemberManager.getUser(client, topData[0].topVoices[i]?.id))?.displayName;
        const text = displayName || 'Silinmiş hesap.';
        canvas.printResponsiveText(text, 130, firstColumns[i], 270);
    }

    for (let i = 0; i < 3; i++) {
        const displayName = (await MemberManager.getUser(client, topData[0].topMessages[i]?.id))?.displayName;
        const text = displayName || 'Silinmiş hesap.';
        canvas.printResponsiveText(text, 692, firstColumns[i], 270);
    }

    for (let i = 0; i < 3; i++) {
        const displayName = (await MemberManager.getUser(client, topData[0].topCameras[i]?.id))?.displayName;
        const text = displayName || 'Silinmiş hesap.';
        canvas.printResponsiveText(text, 130, secondColumns[i], 270);
    }

    for (let i = 0; i < 3; i++) {
        const displayName = (await MemberManager.getUser(client, topData[0].topStreams[i]?.id))?.displayName;
        const text = displayName || 'Silinmiş hesap.';
        canvas.printResponsiveText(text, 692, secondColumns[i], 270);
    }

    canvas.setTextAlign('center');
    canvas.setTextFont('normal 18px Kanit');

    for (let i = 0; i < 3; i++) {
        canvas.printResponsiveText(
            client.utils.numberToString(topData[0].topVoices[i]?.total, true),
            480,
            firstColumns[i] - 3,
            78,
        );
    }

    for (let i = 0; i < 3; i++) {
        canvas.printResponsiveText(
            topData[0].topMessages[i] ? topData[0].topMessages[i]?.total : 'Yok.',
            1042,
            firstColumns[i] - 3,
            78,
        );
    }

    for (let i = 0; i < 3; i++) {
        canvas.printResponsiveText(
            client.utils.numberToString(
                topData[0].topCameras[i] ? topData[0].topCameras[i]?.total : 'Yok.',
                true,
            ),
            480,
            secondColumns[i] - 2,
            78,
        );
    }

    for (let i = 0; i < 3; i++) {
        canvas.printResponsiveText(
            client.utils.numberToString(
                topData[0].topStreams[i] ? topData[0].topStreams[i]?.total : 'Yok.',
                true,
            ),
            1042,
            secondColumns[i] - 2,
            78,
        );
    }

    return new AttachmentBuilder(canvas.png(), { name: 'top.png' });
}

export default generalTopCanvas;

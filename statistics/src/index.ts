import { Client } from '@/base';
import { resolve } from 'path';
import { loadFont } from 'canvas-constructor/skia';

loadFont('Kanit', resolve(__dirname, "assets", "Kanit-Regular.ttf"));

const client = new Client();
client.connect();

process.title = "Statistics";
process.on('unhandledRejection', (error: Error) => console.log(`${error.name}: ${error.message}`));
process.on('uncaughtException', (error: Error) => console.log(`${error.name}: ${error.message}`));

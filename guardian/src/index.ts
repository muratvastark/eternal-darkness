import { Client } from '@/base';

const client = new Client();
client.connect();

process.title = "Guardian"
process.on('unhandledRejection', (error: Error) => console.log(`${error.name}: ${error.message}`));
process.on('uncaughtException', (error: Error) => console.log(`${error.name}: ${error.message}`));

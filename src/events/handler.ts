import { welcomeUserQueueHandler } from './consumer/welcomeUserConsumer.js';

export const functions = [welcomeUserQueueHandler];

export default functions;

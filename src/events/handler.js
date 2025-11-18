import { serve as inngestServe } from 'inngest/hono';
import { welcomeUserQueueHandler } from './consumer/welcomeUserConsumer.js';
import { inngest } from '../config/inngest.js';

export const inngestHandler = inngestServe({
  client: inngest,
  functions: [welcomeUserQueueHandler],
});

export default inngestHandler;

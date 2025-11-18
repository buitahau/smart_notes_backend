import 'dotenv/config';
import { Hono } from 'hono';
import { serve as honoServe } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth.js';
import noteRoutes from './routes/notes.js';
import queryRoutes from './routes/query.js';
import indexRoutes from './routes/indexes.js';
import settingRoutes from './routes/settings.js';
import userRoutes from './routes/users.js';
import welcomeRoutes from './routes/welcome.js';
import { inngestHandler } from './events/handler.js';

const app = new Hono();
const PORT = process.env.PORT || 3000;

app.use('*', cors());
app.use('*', logger());

app.route('/api/auth', authRoutes);
app.route('/api/notes', noteRoutes);
app.route('/api/query', queryRoutes);
app.route('/api/indexes', indexRoutes);
app.route('/api/settings', settingRoutes);
app.route('/api/users', userRoutes);
app.route('/welcome', welcomeRoutes);

app.use('/api/inngest', async c => {
  return inngestHandler(c);
});

app.get('/', c => {
  return c.json({ message: 'API is running' });
});

console.log(`Server is running on port ${PORT}`);

honoServe({
  fetch: app.fetch,
  port: PORT,
});

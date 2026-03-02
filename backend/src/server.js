import app from './app.js';
import env from './config/env.js';
import { connectDatabase } from './config/db.js';

async function startServer() {
  try {
    await connectDatabase(env.mongodbUri);
    app.listen(env.port, env.host, () => {
      console.log(`Server listening on http://${env.host}:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

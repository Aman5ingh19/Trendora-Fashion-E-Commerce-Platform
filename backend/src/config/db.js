const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trendora_db';
  const allowMemoryFallback = process.env.USE_MEMORY_DB_IF_LOCAL_FAILS === 'true' || process.env.NODE_ENV === 'test';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500 // quick timeout so we don't hang if no local mongod
    });
    console.log(`[Database] MongoDB Connected to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    if (allowMemoryFallback) {
      console.warn(`[Database] Could not connect to MongoDB at "${uri}". Falling back to in-memory MongoDB for local development...`);
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] Connected to in-memory MongoDB (${memUri}). Full persistence active for this session.`);
        return conn;
      } catch (memErr) {
        console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
        throw memErr;
      }
    } else {
      console.error(`[Database] MongoDB connection error: ${err.message}`);
      throw err;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (err) {
    console.error('[Database] Disconnect error:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };

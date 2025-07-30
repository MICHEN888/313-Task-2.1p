const { MongoClient } = require("mongodb");
const config = require("../utils/config");

let dbInstance = null;
let client = null;

async function connectDB() {
    if (dbInstance) return dbInstance;

    try {
        client = new MongoClient(config.db);
        await client.connect();
        dbInstance = client.db(config.db_name);
        return dbInstance;
    } catch (error) {
        process.exit(1);
    }
}

function getCollection(collectionName) {
    if (!dbInstance) throw new Error('The database is not connected.');
    return dbInstance.collection(collectionName);
}

module.exports = { connectDB, getCollection };
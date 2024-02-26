import { DB_NAME } from '../constants.js';
import mongoose from 'mongoose';

export let dbInstance = undefined;

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
        dbInstance = connectionInstance;
        console.log(
            `\n☘️ MongoDB Connected! Db host: ${connectionInstance.connection.host}\n`
        );
    } catch (error) {
        console.log('MongoDB connection error: ', error);
        process.exit(1);
    }
};

export default connectDB;

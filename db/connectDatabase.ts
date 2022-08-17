import mongoose from 'mongoose';

const DB_USERNAME = process.env["MONGODB_USERNAME"];
const DB_PASSWORD = process.env["MONGODB_PASSWORD"];
const DB_HOST = process.env["MONGODB_HOST"];
const DB_PORT = process.env["MONGODB_PORT"];

const connectDb = async () => mongoose
    .connect(`mongodb://${DB_HOST}:${DB_PORT}/`, {
        user: DB_USERNAME,
        pass: DB_PASSWORD,
    })
    .then((db) => {
        console.log("Connected to MongoDB.", db);
        return db;
    })
    .catch((err) => console.log("Error while connecting to MongoDB ", err));


export default connectDb;

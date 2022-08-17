import mongoose from 'mongoose';

DB_USER = process.env["MONGODB_USER"];
DB_PASSWORD = process.env["MONGODB_PASSWORD"];
DB_HOST = process.env["MONGODB_HOST"];
DB_PORT = process.env["MONGODB_PORT"];

const connectDb = async () => mongoose
    .connect(`mongodb://${DB_HOST}:${DB_PORT}/`, {
        user: DB_USER,
        pass: DB_PASSWORD,
    })
    .then((db) => {
        console.log("Connected to MongoDB.", db);
        return db;
    })
    .catch((err) => console.log("Error while connecting to MongoDB ", err));


export default connectDb;

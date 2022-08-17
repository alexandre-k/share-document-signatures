import { Schema, model, models } from 'mongoose';

const userSchema = new Schema({
    id: String;
    username: String;
    pubKey: String,
    currentChallenge: {
        type: String,
        required: true,
        unique: true,
    },
});

const User = models.User || model('User', userSchema);

export default User;

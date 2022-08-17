import { Schema, model, models } from 'mongoose';

const userSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    username: String,
    pubKey: String,
    currentChallenge: String
});

const User = models.User || model('User', userSchema);

export default User;

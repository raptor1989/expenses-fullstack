import mongoose, { Document, Schema } from 'mongoose';
import { User as UserType } from 'shared-types';

export interface UserDocument extends Document, Omit<UserType, 'id'> {
    _id: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<UserDocument>(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

export const User = mongoose.model<UserDocument>('User', UserSchema);

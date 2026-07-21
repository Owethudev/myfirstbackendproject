import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
    {
       name: {
            type: String,
            trim: true,
        },

        description: {
              type: String,
              trim: true,
        },

        age: {
            type: Number,
            default: 0,
        },

        portfolio: {
            type: String,
            trim: true,
        },

        author: {
            type: String,
            trim: true,
            default: "Unknown",
        },

        likes: {
            type: Number,
            default: 0,
        },

        comments: {
            type: [{
                text: { type: String, required: true, trim: true },
                author: { type: String, trim: true, default: "Guest" },
                createdAt: { type: Date, default: Date.now },
            }],
            default: [],
        },
    },

    {
        timestamps: true,
    }
);

export const Post = mongoose.model("Post", postSchema);
import mongoose, { Schema } from "mongoose";

// This shape tells the database what one post must look like.
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

        portfolio: {
            type: String,
            trim: true,
        },

        author: {
            type: String,
            trim: true,
            default: "Unknown",
        },
    },

    {
        timestamps: true,
    }
);

export const Post = mongoose.model("Post", postSchema);
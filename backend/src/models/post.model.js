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
        reported: {
            type: Boolean,
            default: false,
        },
        reportReason: {
            type: String,
            default: null,
        },
        moderationStatus: {
            type: String,
            enum: ["pending", "approved", "removed"],
            default: "approved",
        },
    },

    {
        timestamps: true,
    }
);

export const Post = mongoose.model("Post", postSchema);
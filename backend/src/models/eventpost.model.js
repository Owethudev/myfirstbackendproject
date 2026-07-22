import mongoose, { Schema } from "mongoose";

// This shape tells the database what one event must look like.
const eventPostSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},

		location: {
			type: String,
			required: true,
			trim: true,
		},

		theme: {
			type: String,
			required: true,
			trim: true,
		},

		time: {
			type: String,
			required: true,
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
	},
);

export const EventPost = mongoose.model("EventPost", eventPostSchema);

import { EventPost } from "../models/eventpost.model.js";

// This makes a new event after checking its four required pieces.
const createEventPost = async (req, res) => {
	try {
		const { name, location, theme, time, author } = req.body;

		if (!name || !location || !theme || !time) {
			return res.status(400).json({
				message: "Please provide name, location, theme and time",
			});
		}

		// The event stores who made it so only that person can remove it.
		const event = await EventPost.create({
			name,
			location,
			theme,
			time,
			author: author ?? "Unknown",
		});

		return res.status(201).json({
			message: "Event created successfully",
			event,
		});
	} catch (error) {
		return res.status(500).json({
			message: "Internal server error",
			error,
		});
	}
};

// This sends all saved events to the event feed.
const getEventPosts = async (req, res) => {
	try {
		const events = await EventPost.find();
		return res.status(200).json(events);
	} catch (error) {
		return res.status(500).json({
			message: "Internal server error",
			error,
		});
	}
};

// This removes an event only when the name matches its owner.
const deleteEventPost = async (req, res) => {
	try {
		const event = await EventPost.findById(req.params.id);
		if (!event) {
			return res.status(404).json({ message: "Event not found" });
		}

		const { username } = req.body;
		if (!username || event.author !== username) {
			return res.status(403).json({
				message: "You are not authorized to delete this event",
			});
		}

		await EventPost.findByIdAndDelete(req.params.id);
		return res.status(200).json({ message: "Event deleted successfully" });
	} catch (error) {
		return res.status(500).json({
			message: "Internal server error",
			error,
		});
	}
};

export { createEventPost, getEventPosts, deleteEventPost };

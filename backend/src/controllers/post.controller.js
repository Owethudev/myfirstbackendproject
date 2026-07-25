import { Post } from "../models/post.model.js";

// This makes a new project post.
const createPost = async (req, res) => {
    try {
        const { name, description, portfolio, author } = req.body;

        if (!name || !description || !portfolio) {
            return res.status(400).json({
                message: "Please provide name, description and portfolio"
            });
        }  

                    const post = await Post.create({
                        name,
                        description,
                        portfolio,
                        author: author ?? "Unknown",
                    });

            res.status(201).json({
                message: "Post created successfully", post
            });
        

    }catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
    }

}

// This sends all saved posts to the post feed.
const getPosts = async (req, res) => {
    try {
        const { page = "1", limit = "12" } = req.query;
        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
        const skip = (parsedPage - 1) * parsedLimit;

        const query = { moderationStatus: { $ne: "removed" } };
        const totalItems = await Post.countDocuments(query);
        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit);

        const totalPages = Math.max(Math.ceil(totalItems / parsedLimit), 1);

        res.status(200).json({
            currentPage: parsedPage,
            totalPages,
            totalItems,
            hasNextPage: parsedPage < totalPages,
            items: posts,
        });
    } catch (error) {
        res.status(500).json({
            message: "Internal server error", error
        });
    }
};

const getReportedPosts = async (req, res) => {
    try {
        const { page = "1", limit = "20" } = req.query;
        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (parsedPage - 1) * parsedLimit;

        const query = { reported: true };
        const totalItems = await Post.countDocuments(query);
        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit);

        const totalPages = Math.max(Math.ceil(totalItems / parsedLimit), 1);

        res.status(200).json({
            currentPage: parsedPage,
            totalPages,
            totalItems,
            hasNextPage: parsedPage < totalPages,
            items: posts,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

const reviewPost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reportReason, reported, moderationStatus } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (typeof reported === "boolean") {
            post.reported = reported;
        }

        if (reportReason !== undefined) {
            post.reportReason = reportReason;
        }

        if (moderationStatus) {
            post.moderationStatus = moderationStatus;
        }

        await post.save();

        res.status(200).json({ message: "Post review updated", post });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

// This updates a post's information.
const updatePost = async (req, res) => {
    try{
        // The server checks that the update has something to change.
        if(Object.keys(req.body).length === 0){
            return res.status(400).json({
                message: "Please provide data to update"
            });
        }

        const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if(!post) return res.status(404).json({
                message: "Post not found"
            });

         res.status(200).json({
            message: "Post updated successfully", post
        });   
        
    } catch (error){

        res.status(500).json({
            message: "Internal server error", error
        });
    }
}

// This removes a post only when the name matches its owner.
const deletePost = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ message: "Post not found" });

        // The username proves that the person owns this post.
        const { username } = req.body;
        if (!username || post.author !== username) {
            return res.status(403).json({ message: "You are not authorized to delete this post" });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Post deleted successfully" });
    }catch(error){

        res.status(500).json({ message: "Internal server error", error });
    }
}

const adminDeletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.moderationStatus = "removed";
        post.reported = true;
        await post.save();

        res.status(200).json({ message: "Post removed by admin" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

export { createPost, getPosts, getReportedPosts, reviewPost, updatePost, deletePost, adminDeletePost }; 

import {Post} from "../models/post.model.js";

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

const getPosts = async (req, res) => {
    try{
        const posts = await Post.find();
        res.status(200).json(posts);

    }catch(error){

        res.status(500).json({
            message: "Internal server error", error
        });
    }
}

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
export { createPost, getPosts, updatePost, deletePost };
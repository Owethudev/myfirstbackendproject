import {Post} from "../models/post.model.js";

//create a post
const createPost = async (req, res) => {
    try {
        const { name, description, age, portfolio } = req.body;

        if (!name || !description || !age || !portfolio) {
            return res.status(400).json({
                message: "Please provide name, description, age and portfolio"
            });
        }  

          const post = await Post.create({
            name,
            description,
            age,
            portfolio
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
        //basic validation
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
        const deleted = await Post.findByIdAndDelete(req.params.id);

        if(!deleted) return res.status(404).json({
            message: "Post not found"
        });

        res.status(200).json({
            message: "Post deleted successfully"
        });
    }catch(error){

        res.status(500).json({
            message: "Internal server error", error
        });
    }
}
export { createPost, getPosts, updatePost, deletePost };
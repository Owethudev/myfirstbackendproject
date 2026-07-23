import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userVerifiedSchema = new Schema(
    {
        userid: {
            type: String,
            
        },
        uniqueString: {
            type: String,
          
        },
        createdAt: {
            type: Date,
           
        },
        expiresAt: {
            type: Date,
                
            },
    }  
);


export const UserVerification = mongoose.model("UserVerification", userVerificationSchema);
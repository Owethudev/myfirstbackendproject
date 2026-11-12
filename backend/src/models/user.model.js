import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const policyConsentSchema = new Schema(
    {
        termsVersion: { type: String, required: true },
        termsAcceptedAt: { type: Date, required: true },
        privacyVersion: { type: String, required: true },
        privacyAcknowledgedAt: { type: Date, required: true },
        minimumAge: { type: Number, enum: [16], required: true },
        ageConfirmedAt: { type: Date, required: true },
    },
    { _id: false },
);

//model for the user, with username, password, email, verified and verificationToken fields
const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters long"],
            maxlength: [30, "Username must be at most 30 characters long"],
        },
        password: {
            type: String,
            required: true,
            minlength: [6, "Password must be at least 6 characters long"],
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        verified: {
            type: Boolean,
            default: false,
        },
        suspended: {
            type: Boolean,
            default: false,
        },
        policyConsents: {
            type: policyConsentSchema,
            default: undefined,
        },
        verificationToken: {
            type: String,
            default: null,
        },
        verificationTokenExpires: {
            type: Date,
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// The password is scrambled before it is saved.
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// This checks whether a typed password matches the saved password.
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
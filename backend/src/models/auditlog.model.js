import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
    {
        timestamp: {
            type: Date,
            default: Date.now,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        username: {
            type: String,
            default: null,
        },
        email: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            enum: ["user", "admin", "guest"],
            default: "guest",
        },
        method: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        query: {
            type: Schema.Types.Mixed,
            default: {},
        },
        params: {
            type: Schema.Types.Mixed,
            default: {},
        },
        body: {
            type: Schema.Types.Mixed,
            default: {},
        },
        statusCode: {
            type: Number,
            default: null,
        },
        durationMs: {
            type: Number,
            default: null,
        },
        ipAddress: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: false,
    }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
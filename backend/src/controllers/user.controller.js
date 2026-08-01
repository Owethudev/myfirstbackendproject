import {
    registerUser as registerUserService,
    verifyUser as verifyUserService,
    loginUser as loginUserService,
    logoutUser as logoutUserService,
    updateUser as updateUserService,
    deleteUser as deleteUserService,
    listUsers as listUsersService,
    updateUserStatus as updateUserStatusService,
    updateUserRole as updateUserRoleService,
    getAdminStats as getAdminStatsService,
} from "../services/user.service.js";
import { handleControllerError } from "../utils/controllerResponse.js";

// This registers a new user and sends a verification email.
const registerUser = async (req, res) => {
    try {
        const result = await registerUserService(req.body);
        if (result.statusCode === 200 || result.statusCode === 201) {
            return res.status(result.statusCode).json(result.payload);
        }
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to register user");
    }
};

// This verifies a user's email using the token sent in the verification email.
const verifyUser = async (req, res) => {
    try {
        const result = await verifyUserService(req.params.token);
        if (result.statusCode === 200 && result.payload.redirectUrl) {
            return res.redirect(result.payload.redirectUrl);
        }
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to verify user");
    }
};

// This logs in a user by checking their email and password.
const loginUser = async (req, res) => {
    try {
        const result = await loginUserService(req.body);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to log in");
    }
};

// This logs out a user by simply acknowledging the request.
const logoutUser = async (req, res) => {
    try {
        const result = await logoutUserService(
            req.body.email,
            req.body.sessionId || req.body.session_id || req.headers["x-session-id"],
            Boolean(req.body.logoutAll || req.body.logout_all),
        );
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to log out");
    }
};

// This updates a user's profile information.
const updateUser = async (req, res) => {
    try {
        const result = await updateUserService(req.body);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to update profile");
    }
};

// This deletes a user from the database.
const deleteUser = async (req, res) => {
    try {
        const result = await deleteUserService(req.body.email);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to delete user");
    }
};

const listUsers = async (req, res) => {
    try {
        const result = await listUsersService(req.query);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to list users");
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const result = await updateUserStatusService(req.params.id, req.body.suspended);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to update user status");
    }
};

const updateUserRole = async (req, res) => {
    try {
        const result = await updateUserRoleService(req.params.id, req.body.role);
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to update user role");
    }
};

const getAdminStats = async (req, res) => {
    try {
        const result = await getAdminStatsService();
        return res.status(result.statusCode).json(result.payload);
    } catch (error) {
        return handleControllerError(res, error, "Unable to fetch admin stats");
    }
};

export { registerUser, verifyUser, loginUser, logoutUser, updateUser, deleteUser, listUsers, updateUserStatus, updateUserRole, getAdminStats };

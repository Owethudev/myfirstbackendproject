import { forgotPassword as forgotPasswordService, resetPassword as resetPasswordService } from "../services/auth.service.js";
import { handleControllerError } from "../utils/controllerResponse.js";

// This controller intentionally keeps the response generic so a caller
// cannot tell whether an email address exists in the database.
const forgotPassword = async (req, res) => {
  try {
    const result = await forgotPasswordService(req.body.email);
    return res.status(result.statusCode).json(result.payload);
  } catch (error) {
    return handleControllerError(res, error, "Unable to process password reset request");
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await resetPasswordService(req.body);
    return res.status(result.statusCode).json(result.payload);
  } catch (error) {
    return handleControllerError(res, error, "Unable to reset password");
  }
};

export { forgotPassword, resetPassword };

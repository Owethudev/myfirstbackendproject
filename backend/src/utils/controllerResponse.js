const createResult = (statusCode, payload) => ({
  statusCode,
  payload,
});

const createError = (statusCode, message, extra = {}) => ({
  statusCode,
  payload: {
    message,
    ...extra,
  },
});

const handleControllerError = (res, error, fallbackMessage = "Internal server error") => {
  if (error && typeof error === "object" && "statusCode" in error && "payload" in error) {
    return res.status(error.statusCode).json(error.payload);
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

export { createResult, createError, handleControllerError };

function errorHandler(err, req, res, next) {
    console.error("Erreur serveur:", err);

    const statusCode = err.statusCode || 500;

    const message =
        statusCode === 500
            ? "Erreur interne du serveur."
            : err.message || "Erreur lors du traitement de la requête.";

    res.status(statusCode).json({
        error: message,
    });
}

module.exports = errorHandler;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        const errors = [];
        if (schema.body) {
            const { error } = schema.body.validate(req.body);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (schema.query) {
            const { error } = schema.query.validate(req.query);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (schema.params) {
            const { error } = schema.params.validate(req.params);
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    details: errors
                }
            });
            return;
        }
        next();
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map
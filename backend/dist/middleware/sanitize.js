"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFields = exports.sanitizeInput = void 0;
function sanitizeValue(value) {
    if (typeof value === 'string') {
        return value
            .replace(/<[^>]*>/g, '')
            .replace(/[<>'"]/g, '')
            .trim();
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
        const sanitized = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                sanitized[key] = sanitizeValue(value[key]);
            }
        }
        return sanitized;
    }
    return value;
}
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        req.query = sanitizeValue(req.query);
    }
    if (req.params) {
        req.params = sanitizeValue(req.params);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
const sanitizeFields = (...fields) => {
    return (req, res, next) => {
        if (req.body) {
            fields.forEach(field => {
                if (req.body[field]) {
                    req.body[field] = sanitizeValue(req.body[field]);
                }
            });
        }
        next();
    };
};
exports.sanitizeFields = sanitizeFields;
//# sourceMappingURL=sanitize.js.map
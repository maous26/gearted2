import Joi from 'joi';
export declare const authSchemas: {
    register: {
        body: Joi.ObjectSchema<any>;
    };
    login: {
        body: Joi.ObjectSchema<any>;
    };
    refreshToken: {
        body: Joi.ObjectSchema<any>;
    };
    forgotPassword: {
        body: Joi.ObjectSchema<any>;
    };
    resetPassword: {
        body: Joi.ObjectSchema<any>;
    };
    verifyEmail: {
        body: Joi.ObjectSchema<any>;
    };
    changePassword: {
        body: Joi.ObjectSchema<any>;
    };
};
//# sourceMappingURL=validationSchemas.d.ts.map
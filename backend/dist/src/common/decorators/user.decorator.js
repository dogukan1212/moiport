"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTenantId = exports.GetUser = void 0;
const common_1 = require("@nestjs/common");
exports.GetUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
        return request.user[data];
    }
    return request.user;
});
exports.GetTenantId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    if (!tenantId) {
        throw new common_1.UnauthorizedException('Geçersiz oturum.');
    }
    return tenantId;
});
//# sourceMappingURL=user.decorator.js.map
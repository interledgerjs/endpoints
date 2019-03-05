"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Request {
    constructor(frame, responseCallback, timeoutCallback) {
        this._request = frame;
        this._responseCallback = responseCallback;
        const timeout = this._request.expiresAt.getMilliseconds() - new Date().getMilliseconds();
        this._timer = setTimeout(() => {
            timeoutCallback();
        }, timeout);
    }
    responseReceived(response) {
        clearTimeout(this._timer);
        this._responseCallback(response);
    }
}
exports.Request = Request;
//# sourceMappingURL=request.js.map
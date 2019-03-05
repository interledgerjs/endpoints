"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AddressMappedHandlerProvider {
    constructor(handlers) {
        if (handlers) {
            for (const [address, handler] of handlers) {
                this.handlers.set(address, handler);
            }
        }
    }
    get defaultHandler() {
        return this.handlers.get('*');
    }
    set defaultHandler(handler) {
        if (handler) {
            this.handlers.set('*', handler);
        }
        else {
            this.handlers.delete('*');
        }
    }
    provideHandler(request) {
        if (request.destination.startsWith('peer')) {
            const handler = this.handlers.get(request.destination);
            if (handler)
                return handler;
        }
        return this.handlers.get('*');
    }
}
exports.AddressMappedHandlerProvider = AddressMappedHandlerProvider;
//# sourceMappingURL=provider.js.map
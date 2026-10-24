export function asyncWrapper(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=asyncWrapper.js.map
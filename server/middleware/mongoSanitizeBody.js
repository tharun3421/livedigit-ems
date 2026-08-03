// Strips Mongo operator keys ($gt, $where, etc.) and dotted keys from request
// bodies to guard against NoSQL-injection-shaped payloads.
//
// We don't use the `express-mongo-sanitize` package here because it tries to
// reassign `req.query`, which Express 5 made a read-only getter — that throws
// on every request. This only ever mutates `req.body` in place, which is
// always a plain object Express creates fresh per-request, so it's safe.

const isPlainObject = (val) =>
    Object.prototype.toString.call(val) === "[object Object]"

const sanitize = (obj) => {
    if (Array.isArray(obj)) {
        obj.forEach(sanitize)
        return obj
    }

    if (!isPlainObject(obj)) return obj

    for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".")) {
            delete obj[key]
            continue
        }
        sanitize(obj[key])
    }

    return obj
}

export const mongoSanitizeBody = (req, res, next) => {
    if (req.body) sanitize(req.body)
    next()
}
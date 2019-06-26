export function getConnection(pool) {
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if(error) {
                pool.emit('all-errors', error)
                pool.emit('connection-error', error)
            }
            if(error) reject(error)
            else resolve(connection)
        })
    })
}

export function query(pool, queryStr, params) {
    return new Promise((resolve, reject) => {
        pool.query(queryStr, params, (error, results, fields) => {
            if(error) {
                pool.emit('all-errors', error)
                pool.emit('query-error', error)
            }
            if(error) reject(error)
            else resolve({results, fields})
        })
    })
}

export function startTransaction(pool) {
    return getConnection(pool)
        .then(connection => {
            return query(connection, 'START TRANSACTION')
                .then(() => connection)
        })
}

export function commit(connection) {
    return query(connection, 'COMMIT')
        .then(() => connection.release())
}

export function rollback(connection) {
    return query(connection, 'ROLLBACK')
        .then(() => connection.release())
}

export function isPool(poolOrConnection) {
    return !!poolOrConnection.getConnection
}

export function isConnection(poolOrConnection) {
    return !isPool(poolOrConnection)
}

// runs f in a transaction. f must return a promise that takes a connection. If
// poolOrConnection is a pool, will start a new transaction, commit after f is
// done, and rollback on exception. If poolOrConnection is not a pool, will
// assume already in a transaction, just run if, and leave it to outer caller
// to commit/rollback. Returned promise will resolve to whatever f resolves to.
export function guardTransaction(poolOrConnection, f) {
    if(isPool(poolOrConnection)) {
        return startTransaction(poolOrConnection)
            .then(connection => {
                return f(connection)
                    .catch(err => {
                        return rollback(connection)
                            .then(() => {
                                throw err // propagate the error
                            })
                    })
                    .then(x => {
                        return commit(connection)
                            // resolve to whatever f returned
                            .then(() => x)
                    })
            })
    }
    // assume we're already in a transaction
    else {
        return f(poolOrConnection)
    }
}

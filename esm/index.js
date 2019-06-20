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

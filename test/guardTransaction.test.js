const {get} = require('@cullylarson/f')
const {query, startTransaction, commit, guardTransaction, isPool, isConnection, rollback} = require('../cjs')
const {Pool} = require('./utils')

afterAll(Pool.release)

beforeEach(() => query(Pool.get(), `
CREATE TABLE blah (
    id                  INT UNSIGNED AUTO_INCREMENT,
    name                VARCHAR(255),
    created             DATETIME,
    modified            DATETIME,
    PRIMARY KEY (id),
    UNIQUE (name)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
)

afterEach(() => query(Pool.get(), 'DROP TABLE blah'))

test('Starts a new transaction when passed a pool.', () => {
    const pool = Pool.get()

    return guardTransaction(pool, connection => {
        expect(isPool(connection)).toBe(false)
        expect(isConnection(connection)).toBe(true)

        return Promise.resolve('asdf')
    })
})

test('Commits when passed a pool.', () => {
    const pool = Pool.get()

    return guardTransaction(pool, connection => {
        return Promise.all([
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name1']),
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name2']),
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name3']),
        ])
    })
        .then(() => query(pool, 'SELECT COUNT(*) as count FROM blah'))
        .then(get(['results', 0, 'count'], undefined))
        .then(x => expect(x).toBe(3))
})

test('Rolls back when passed a pool and encounters an exceptions.', () => {
    const pool = Pool.get()

    return guardTransaction(pool, connection => {
        return Promise.all([
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name1']),
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name2']),
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name3']),
        ])
            .then(() => {
                throw Error('blah')
            })
    })
        .catch(() => undefined) // gobble the error
        .then(() => query(pool, 'SELECT COUNT(*) as count FROM blah'))
        .then(get(['results', 0, 'count'], undefined))
        .then(x => expect(x).toBe(0))
})

test('Does not start a transaction when passed a connection.', () => {
    const pool = Pool.get()

    return startTransaction(pool)
        .then(connection => {
            return guardTransaction(connection, connection2 => {
                expect(connection2).toBe(connection)

                return Promise.resolve('asdf')
            })
                .then(() => rollback(connection))
        })
})

test('Does not commit a transaction when passed a connection.', () => {
    const pool = Pool.get()

    return startTransaction(pool)
        .then(connection => guardTransaction(connection, connection2 => {
            return Promise.all([
                query(connection2, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name1']),
                query(connection2, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name2']),
                query(connection2, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name3']),
            ])
        })
            // select before committing, should not have any results
            .then(() => query(pool, 'SELECT COUNT(*) as count FROM blah'))
            .then(get(['results', 0, 'count'], undefined))
            .then(x => expect(x).toBe(0))
            .then(() => commit(connection))
            // not that we've commited, should have the committed results
            .then(() => query(pool, 'SELECT COUNT(*) as count FROM blah'))
            .then(get(['results', 0, 'count'], undefined))
            .then(x => expect(x).toBe(3))
        )
})

test('Does not roll back a transaction when passed a connection.', () => {
    const pool = Pool.get()

    return startTransaction(pool)
        .then(connection => guardTransaction(connection, connection2 => {
            return Promise.all([
                query(connection2, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name1']),
                query(connection2, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name2']),
                query(connection2, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name3']),
            ])
                .then(() => {
                    throw new Error('blah')
                })
        })
            .catch(_ => undefined) // gobble the error
            // select before committing, should not have any results
            .then(() => query(pool, 'SELECT COUNT(*) as count FROM blah'))
            .then(get(['results', 0, 'count'], undefined))
            .then(x => expect(x).toBe(0))
            .then(() => commit(connection))
            // not that we've commited, should have the committed results
            .then(() => query(pool, 'SELECT COUNT(*) as count FROM blah'))
            .then(get(['results', 0, 'count'], undefined))
            .then(x => expect(x).toBe(3))
        )
})

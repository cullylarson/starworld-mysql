const {get} = require('@cullylarson/f')
const {query, startTransaction, commit, rollback} = require('../cjs')
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

test('Transactions work.', () => {
    const pool = Pool.get()

    return startTransaction(pool)
        .then(connection => Promise.all([
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name1']),
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name2']),
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name3']),
        ])
            .then(() => commit(connection))
        )
        .then(() => query(pool, 'SELECT COUNT(*) as count FROM blah'))
        .then(get(['results', 0, 'count'], undefined))
        .then(x => expect(x).toBe(3))
})

test('Rolling back a transaction work.', () => {
    const pool = Pool.get()

    return startTransaction(pool)
        .then(connection => Promise.all([
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name1']),
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name2']),
            query(connection, 'INSERT INTO blah (name, created) VALUES (?, NOW())', ['name3']),
        ])
            .then(() => rollback(connection))
        )
        .then(() => query(pool, 'SELECT COUNT(*) as count FROM blah'))
        .then(get(['results', 0, 'count'], undefined))
        .then(x => expect(x).toBe(0))
})

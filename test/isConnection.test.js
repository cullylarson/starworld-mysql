const {query, startTransaction, rollback, isConnection} = require('../cjs')
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

test('Correctly identifies a connection.', () => {
    const pool = Pool.get()

    return startTransaction(pool)
        .then(connection => {
            expect(isConnection(connection)).toBe(true)

            return rollback(connection)
        })
})

test('Does not think a pool is a connection.', () => {
    const pool = Pool.get()

    expect(isConnection(pool)).toBe(false)
})

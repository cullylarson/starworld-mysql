const {get} = require('@cullylarson/f')
const {query} = require('../cjs')
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

test('Can run INSERT query.', () => {
    const pool = Pool.get()

    const name = 'hoop master'

    return query(pool, 'INSERT INTO blah (name, created) VALUES (?, NOW())', [name])
        .then(x => expect(get(['results', 'insertId'], undefined, x)).toBe(1))
})

test('Can run SELECT query.', () => {
    const pool = Pool.get()

    const name = 'hoop master'

    return query(pool, 'INSERT INTO blah (name, created) VALUES (?, NOW())', [name])
        .then(get(['results', 'insertId'], undefined))
        .then(id => query(pool, 'SELECT * FROM blah WHERE id = ?', [id]))
        .then(get(['results', 0], undefined))
        .then(x => {
            expect(x).toBeDefined()
            expect(x.name).toBe(name)
        })
})

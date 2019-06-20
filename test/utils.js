const {createPool} = require('mysql2')

const Pool = (() => {
    let pool

    return {
        get: () => {
            if(pool) return pool

            pool = createPool({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
                port: process.env.MYSQL_PORT,
            })

            return pool
        },

        release: () => {
            if(!pool) return Promise.resolve()

            return new Promise((resolve, reject) => {
                pool.end(err => {
                    if(err) return reject(err)

                    pool = null
                    resolve()
                })
            })
        },
    }
})()

module.exports = {
    Pool,
}

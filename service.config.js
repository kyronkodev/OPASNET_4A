module.exports = {
    apps: [
        {
            name: 'opasnet4a-dev',
            script: 'bin/www',
            instances: 1,
            exec_mode: 'cluster',
            listen_timeout: 50000,
            kill_timeout: 5000,
            env: {
                APPLICATION_STATUS : 'development',
                PORT : 80,
                DATABASE_HOST : "211.192.7.222",
                DATABASE_USER : "kyronko",
                DATABASE_PASSWORD : "rnswidla1!",
                DATABASE_PORT : 5432,
                DATABASE_DATABASE : "opasnet_4a",
                SESSION_SECRET : "opasnet4a_session_secret_key_2026"
            }
        },
        {
            name: 'opasnet4a-prod',
            script: 'bin/www',
            instances: 1,
            exec_mode: 'cluster',
            listen_timeout: 50000,
            kill_timeout: 5000,
            env: {
                APPLICATION_STATUS : 'production',
                PORT : 80,
                DATABASE_HOST : "localhost",
                DATABASE_USER : "postgres",
                DATABASE_PASSWORD : "password",
                DATABASE_PORT : 5432,
                DATABASE_DATABASE : "opasnet_4a",
                SESSION_SECRET : "opasnet4a_session_secret_key_2026"
            }
        }
    ]
}

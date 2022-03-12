const {Client} = require('pg');

const connectionString = 'postgres://zjoddfghrhnttf:02528e5449d5e48d544ad1665a18bb9e2a32c3ef3511f909dc27931b75fac96d@ec2-44-195-191-252.compute-1.amazonaws.com:5432/db9uklqkd2acm7';

const client = new Client({
    connectionString: connectionString,
    ssl: {rejectUnauthorized: false}
});

module.exports = client;
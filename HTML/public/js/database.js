const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Проверка подключения при старте
pool.query('SELECT NOW()')
    .then(() => console.log('PostgreSQL connected'))
    .catch(err => console.error('PostgreSQL connection error', err));

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
});

module.exports = {
    pool,
    async getWarningsFromDatabase(guildId) {
        try {
            const res = await pool.query(
                `SELECT id, user_id as "userId", user_name as "username", 
           reason, created_at as "date" 
           FROM warns WHERE guild_id = $1 ORDER BY created_at DESC`,
                [guildId]
            );
            return res.rows;
        } catch (err) {
            console.error('Error fetching warnings:', err);
            return [];
        }
    },

    async removeWarningFromDatabase(id) {
        try {
            const result = await pool.query(
                'DELETE FROM warns WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rowCount > 0;
        } catch (err) {
            console.error('Error removing warning:', err);
            return false;
        }
    },

    async addWarningToDatabase(userId, username, moderatorId, reason, guildId) {
        try {
            const res = await pool.query(
                `INSERT INTO warns 
                (user_id, user_name, moderator_id, reason, guild_id) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING *`,
                [userId, username, moderatorId, reason, guildId]
            );
            return res.rows[0];
        } catch (err) {
            console.error('Error adding warning:', err);
            return null;
        }
    },

    async createVerificationRequest(userId, username, avatar, message = '') {
        try {
            const res = await pool.query(
                `INSERT INTO verification_requests 
                (user_id, user_name, user_avatar, message, status) 
                VALUES ($1, $2, $3, $4, 'pending') 
                RETURNING *`,
                [userId, username, avatar, message]
            );
            return res.rows[0];
        } catch (err) {
            console.error('Error creating verification request:', err);
            return null;
        }
    },
    
    async updateVerificationRequest(requestId, updates) {
        try {
            const { status, moderatorId, moderatorName, reason } = updates;
            const res = await pool.query(
                `UPDATE verification_requests 
                SET status = $1, moderator_id = $2, moderator_name = $3, reason = $4 
                WHERE id = $5 
                RETURNING *`,
                [status, moderatorId, moderatorName, reason, requestId]
            );
            return res.rows[0];
        } catch (err) {
            console.error('Error updating verification request:', err);
            return null;
        }
    },
    
    async getVerificationRequests(status) {
        try {
            let query = 'SELECT * FROM verification_requests';
            const params = [];
            
            if (status) {
                query += ' WHERE status = $1';
                params.push(status);
            }
            
            query += ' ORDER BY created_at DESC';
            
            const res = await pool.query(query, params);
            return res.rows;
        } catch (err) {
            console.error('Error fetching verification requests:', err);
            return [];
        }
    }

};
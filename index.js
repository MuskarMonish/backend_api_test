const express = require('express');
const { pool } = require('./db/citus');

const app = express();

app.use(express.json());



    // Check if the username already exists in the database
    const checkUsernameExists = async (username) => {
        try {
            const query = 'SELECT * FROM Users WHERE username = $1';
            const values = [username];
            const result = await pool.query(query, values);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error checking username:', error);
            throw error;
        }
    };

    // Endpoint for the home page
    app.get('/', (req, res) => {
        res.send('Welcome to Backend test <br/> /register for registering a user(POST) <br/> /login for user login and generating api_key(POST) <br/> /blog for creating a blog post(please provide api_key in header)(POST) <br/> /blogs for getting all blog posts for a user(please provide api_key in header)(GET)');
        
    });

    // Endpoint for registering a user
    app.post('/register', async (req, res) => {
        const { username, password } = req.body;

        try {
            // Check if the username already exists
            const usernameExists = await checkUsernameExists(username);
            if (usernameExists) {
                res.status(400).json({ message: 'Username already exists' });
                return;
            }

            // Insert new user data into the Users table
            const query = 'INSERT INTO Users (username, password) VALUES ($1, $2)';
            const values = [username, password];
            await pool.query(query, values);

            res.status(200).json({ message: 'User registered successfully' });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
    // Endpoint for user login
    app.post('/login', async (req, res) => {
        const { username,password } = req.body;
        a= username;
        try {
            // Check if the username and password match
            const query = 'SELECT * FROM Users WHERE username = $1 AND password = $2';
            const values = [a, password];
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                res.status(401).json({ message: 'Invalid username or password' });
                return;
            }

            // Generate and store the API key for the user
            const apiKey = generateApiKey();
            const username = result.rows[0].username;
            const insertQuery = 'INSERT INTO ApiKeys (username, api_key) VALUES ($1, $2)';
            const insertValues = [username, apiKey];
            await pool.query(insertQuery, insertValues);
            res.status(200).json({ api_key: apiKey });
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // Endpoint for creating a blog post
    app.post('/blog', async (req, res) => {
        const { title, description } = req.body;
        const apiKey = req.headers['api_key'];
        if (!apiKey) {
            res.status(401).json({ message: 'API key is required' });
            return;
        }

        try {
            // Check if the API key is valid
            const query = 'SELECT * FROM ApiKeys WHERE api_key = $1';
            const values = [apiKey];
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                res.status(401).json({ message: 'Invalid API key' });
                return;
            }

            // Insert new blog post into the Blogs table
            const username = result.rows[0].username;
            const insertQuery = 'INSERT INTO Blogpost (username, title, description) VALUES ($1, $2, $3)';
            const insertValues = [username, 'hello world2', 'welcome to the world of programming2'];
            await pool.query(insertQuery, insertValues);

            res.status(200).json({ message: 'Blog post created successfully' });
        } catch (error) {
            console.error('Error creating blog post:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // Endpoint for getting all blog posts for a user
    app.get('/blogs', async (req, res) => {
        const apiKey = req.headers['api_key'];
        
        if (!apiKey) {
            res.status(401).json({ message: 'API key is required' });
            return;
        }

        try {
            // Check if the API key is valid
            const query = 'SELECT * FROM ApiKeys WHERE api_key = $1';
            const values = [apiKey];
            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                res.status(401).json({ message: 'Invalid API key '+ apiKey });
                return;
            }

            // Get all blog posts for the user
            const username = result.rows[0].username;
            const selectQuery = 'SELECT title, description FROM Blogpost WHERE username = $1';
            const selectValues = [username];
            const blogPosts = await pool.query(selectQuery, selectValues);

            res.status(200).json(blogPosts.rows);
        } catch (error) {
            console.error('Error getting blog posts:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // Function to generate a random API key
    function generateApiKey() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let apiKey = '';

        for (let i = 0; i < 32; i++) {
            apiKey += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        return apiKey;
    }
    // Middleware to check if API key is provided
    const checkApiKey = (req, res, next) => {
        const apiKey = req.headers['api_key'];

        if (!apiKey) {
            res.status(401).json({ message: 'API key is required' });
            return;
        }

        next();
    };

    // Apply checkApiKey middleware to /blog and /blogs endpoints
    app.use(['/blog', '/blogs'], checkApiKey);
// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
const express = require('express');
const connectDB = require('./config/db');
const usersRouter = require('./routes/api/users');
const authRouter = require('./routes/api/auth');
const profileRouter = require('./routes/api/profile');
const postsRouter = require('./routes/api/posts');

const app = express();

// connect to db
connectDB();

app.get('/', (req, res) => res.send('API Running'));

// define routes
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/posts', postsRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

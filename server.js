// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000; // Use the port from environment variable or default to 3000

// Set up Sequelize to use SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite3' // Specify the file to store the SQLite database
});

// Define the 'Favorite' model for storing favorite currency pairs
const Favorite = sequelize.define('Favorite', {
    baseCurrency: {
        type: DataTypes.STRING,
        allowNull: false // Base currency cannot be null
    },
    targetCurrency: {
        type: DataTypes.STRING,
        allowNull: false // Target currency cannot be null
    }
});

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle adding a new favorite currency pair
app.post('/api/favorites', async (req, res) => {
    try {
        const { baseCurrency, targetCurrency } = req.body; // Get base and target currencies from request body
        const favorite = await Favorite.create({ baseCurrency, targetCurrency }); // Create a new favorite in the database
        res.status(201).json(favorite); // Respond with the created favorite and status 201
    } catch (error) {
        res.status(500).json({ error: error.message }); // Respond with error message and status 500 on failure
    }
});

// Route to handle fetching all favorite currency pairs
app.get('/api/favorites', async (req, res) => {
    try {
        const favorites = await Favorite.findAll(); // Fetch all favorites from the database
        res.status(200).json(favorites); // Respond with the list of favorites and status 200
    } catch (error) {
        res.status(500).json({ error: error.message }); // Respond with error message and status 500 on failure
    }
});

// Route to handle deleting all favorite currency pairs
app.delete('/api/favorites', async (req, res) => {
    try {
        console.log(`Attempting to delete all favorites`); // Log the request
        await Favorite.destroy({ where: {}, truncate: true }); // Delete all entries in the 'Favorite' table
        console.log(`Successfully deleted all favorites`);
        res.status(204).end(); // Respond with status 204 (No Content) on success
    } catch (error) {
        console.error('Error deleting all favorites:', error); // Log the error
        res.status(500).json({ error: error.message }); // Respond with error message and status 500 on failure
    }
});

// Synchronize the Sequelize models with the database and start the server
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`); // Log that the server is running
    });
});

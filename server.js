const express = require('express'); 
const path = require('path');
const connectDB = require('./db'); // Import database connection
const Task = require('./task'); // Import the Task model
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all routes

console.log(connectDB);
connectDB(); 

app.use(express.json());

app.get('/',(req,res)=>{
    res.send("Welcome to the homepage");
})

app.get('/admin',(req,res)=>{
    res.send("this is the admin page");
})

app.get('/tasks', async (req, res) => {
    try {
      const tasks = await Task.find(); // Fetch all tasks
      res.json(tasks); // Send tasks as JSON response
    } catch (error) {
      console.error('Error fetching tasks:', error); // Log the full error in the server console
      res.status(500).json({ error: 'Server error', message: error.message }); // Send error message in the response
    }
  });
  
  if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, 'client/build')));
  
    // Serve index.html for any route that doesn't match an API route
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
  }
  
  const PORT = process.env.PORT || 3000;

app.listen(3000);
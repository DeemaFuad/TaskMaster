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

  app.post('/tasks', async (req, res) => {
    try {
      const { name, comment } = req.body;
      const newTask = new Task({ name, comment, finished: false });
      await newTask.save();
      res.json(newTask);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
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


  app.delete('/tasks/:taskId', async (req, res) => {
    try {
      const taskId = req.params.taskId;
  
      // Try to delete the task by _id
      const result = await Task.deleteOne({ _id: taskId });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      return res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Error deleting task:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  app.put('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { finished } = req.body;
  
    if (typeof finished !== 'boolean') {
      return res.status(400).send('Invalid task status');
    }
  
    try {
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { finished },
        { new: true } // Returns the updated task
      );
  
      if (!updatedTask) {
        return res.status(404).send('Task not found');
      }
  
      res.status(200).json(updatedTask);
    } catch (error) {
      res.status(500).send('Error updating task');
    }
  });
  
  const PORT = process.env.PORT || 3000;

app.listen(3000);
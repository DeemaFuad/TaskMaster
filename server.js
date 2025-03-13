const express = require('express'); 
const path = require('path');
const connectDB = require('./db'); // Import database connection
const Task = require('./task'); // Import the Task model
const cors = require('cors');
const User = require('./user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken, isAdmin } = require('./authMiddleware');
const JWT_SECRET = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2";



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

app.get('/tasks', authenticateToken, async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(400).json({ message: 'User not authenticated' });
  }

  try {
    // Filter tasks by the authenticated user's ID
    const tasks = await Task.find({ userId: req.user.userId }).populate('userId');
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});


app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const { name, comment } = req.body;
    const newTask = new Task({ 
      name, 
      comment, 
      finished: false, 
      userId: req.user.userId  // Changed from req.user._id to req.user.userId
    });
    await newTask.save();
    res.json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// ... existing code ...
  
  
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
// handle editing task
app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { name, comment, finished } = req.body;

  console.log('Updating task with ID:', id);
  console.log('Request Body:', req.body);
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { name, comment, finished },  // Update name, comment, and finished
      { new: true }  // Return the updated task
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updatedTask);  // Return updated task to frontend
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
});


// User signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
      // Check if the user already exists by username or email
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create a new user with the hashed password
      const newUser = new User({
          username,
          email,
          passwordHash,
          role: 'user' // Set default role as 'user'
      });

      // Save the new user to the database
      await newUser.save();

      res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.log("this is the error:",error);
      res.status(500).json({ message: 'Server error' });
  }
});
  //login:
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token if the credentials are correct
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-passwordHash');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/admin/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for a specific user (admin only)
app.get('/admin/users/:userId/tasks', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching tasks for user:', userId);
    
    // First check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const tasks = await Task.find({ userId }).populate('userId');
    console.log('Found tasks:', tasks.length);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(3000);
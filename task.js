const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: String,
  comment: String,
  finished: Boolean,
},{
  timestamps: true,
});

// Define and export the Task model, make sure the third argument ('list') is correct
const Task = mongoose.model('Task', taskSchema, 'list'); // 'list' is your collection name

module.exports = Task; // Export the Task model for use in other files

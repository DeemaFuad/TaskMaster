const mongoose = require('mongoose');

const uri = 'mongodb+srv://deema:Deema2003@db.msxdi.mongodb.net/tasks'; // Ensure database name is included

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Exit process if connection fails
  }
};

module.exports = connectDB; // ✅ Now it's correctly defined and exported



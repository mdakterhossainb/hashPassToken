require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with failure
  }
};

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  bio: String,
  password: String,
});
const userModel = mongoose.model("user", userSchema);

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  createdBy: String,
});

const BookModel = mongoose.model("Book", bookSchema);

app.post("/book", async (req, res) => {
  const mybody = req.body;
  console.log(mybody);
  try {
    const hashedPassword = await bcrypt.hash(mybody.password, 10);
    const newBook = new BookModel({ ...mybody, password: hashedPassword });
    await newBook.save();
    res.status(201).json({
      message: "book created successfully",
      book: mybody,
    });
  } catch (error) {
    console.error("Error saving book:", error);
    return res
      .status(500)
      .json({ message: "Error saving book", error: error.message });
  }
});
app.post("/register", async (req, res) => {
  const mybody = req.body;
  console.log(mybody);
  try {
    const hashedPassword = await bcrypt.hash(mybody.password, 10);
    const newUser = new userModel({ ...mybody, password: hashedPassword });
    await newUser.save();
    res.status(201).json({
      message: "user created successfully",
      user: mybody,
    });
  } catch (error) {
    console.error("Error saving user:", error);
    return res
      .status(500)
      .json({ message: "Error saving user", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign(
        { id: user._id.toString(), email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );
      return res.status(200).json({ message: "Login successful", user, token });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .json({ message: "Error during login", error: error.message });
  }
});

app.get("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token);

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded.id);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Profile retrieved successfully", user });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ message: "Invalid token" });
  }
});

app.get("/book/", (req, res) => {
  res
    .status(200)
    .json({ message: "book retrieved successfully", book: mybody });
});
app.get("/book/:id", (req, res) => {
  const { id } = req.params;
  res.status(200).json({
    message: "book retrieved successfully",
    book: {
      id: id,
      title: `book title`,
      author: `book author `,
    },
  });
});

app.listen(PORT, async () => {
  await connectDB();
  console.log(`server is running on port http://localhost:${PORT}`);
});

//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZGE0OTliMjMwZjhmY2JiMjk3ZDM1YyIsImVtYWlsIjoiYWt0ZXJob3NzYWluNDU0LmNvbSIsImlhdCI6MTc5MjY5MDYzMSwiZXhwIjoxNzkyNjk0MjMxfQ.jwLzKQ_tC9twHCAuDw5JLMDPytJq8XHJ7iAUoUoJjHc"

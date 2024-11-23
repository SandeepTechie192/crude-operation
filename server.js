const express = require("express");
const cors = require("cors");
const mysql = require("mysql");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", methods: ["GET", "POST", "PUT", "DELETE"] }));

require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,      // Use the DB_HOST from the .env file
  user: process.env.DB_USER,      // Use the DB_USER from the .env file
  password: process.env.DB_PASS,  // Use the DB_PASS from the .env file
  database: process.env.DB_NAME   // Use the DB_NAME from the .env file
});
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
  console.log("Connected to the database");
});

// Queries
const queries = {
  fetchStudents: "SELECT * FROM student",
  insertStudent: "INSERT INTO student (`Name`, `Email`) VALUES (?)",
  updateStudent: "UPDATE student SET `Name` = ?, `Email` = ? WHERE ID = ?",
  deleteStudent: "DELETE FROM student WHERE ID = ?"
};

app.get("/", (req, res) => {
  db.query(queries.fetchStudents, (err, data) => {
    if (err) {
      console.error("Error fetching students:", err);
      return res.status(500).json({ error: "Failed to fetch students" });
    }
    res.status(200).json(data);
  });
});


app.post("/create", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  const checkQuery = "SELECT * FROM student WHERE Email = ?";
  db.query(checkQuery, [email], (err, data) => {
    if (err) {
      console.error("Error checking for existing student:", err);
      return res.status(500).json({ error: "Error checking for existing student" });
    }
    if (data.length > 0) {
      return res.status(400).json({ error: "Student with this email already exists" });
    }
    const insertQuery = "INSERT INTO student (`Name`, `Email`) VALUES (?)";
    db.query(insertQuery, [[name, email]], (err, result) => {
      if (err) {
        console.error("Error inserting student:", err);
        return res.status(500).json({ error: "Failed to create student" });
      }
      res.status(201).json({ message: "Student created successfully", data: result });
    });
  });
});


app.put("/update/:id", (req, res) => {
  const { name, email } = req.body;
  const id = req.params.id;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  db.query(queries.updateStudent, [name, email, id], (err, data) => {
    if (err) {
      console.error("Error updating student:", err);
      return res.status(500).json({ error: "Failed to update student" });
    }
    if (data.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(200).json({ message: "Student updated successfully" });
  });
});


app.delete("/student/:id", (req, res) => {
  const id = req.params.id;
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID provided" });
  }
  const sql = queries.deleteStudent; 
  db.query(sql, [id], (err, data) => {
    if (err) {
      console.error("Error deleting student:", err);
      return res.status(500).json({ error: "Failed to delete student" });
    }
    if (data.affectedRows === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.status(200).json({ message: "Student deleted successfully" });
  });
});


app.listen(8081, () => {
  console.log("Server is running on port 8081");
});

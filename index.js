import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import pg from "pg";

const app = express();
const port = process.env.PORT || 4000;

const config = {
  user: "avnadmin",
  password: "AVNS_pnNoict5KxUv8KxyVKJ",
  host: "econify-econify.h.aivencloud.com",
  port: "11088",
  database: "defaultdb",
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./ca.pem").toString(),
  },
};

const db = new pg.Client(config);
db.connect(function (err) {
  db.query("SELECT VERSION()", [], function (err, result) {
    console.log(result.rows[0]);
  });
});


// const db = new pg.Client({
//   user: "postgres",
//   host: "localhost",
//   database: "econify",
//   password: "0211",
//   port: 5432,
// });

// db.connect((err) => {
//   if (err) {
//     console.error('error connecting to database:', err);
//     process.exit(1);
//   }
// });


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// GET all posts
app.get("/posts", async (req, res) => {
  const result = await db.query("SELECT * FROM posts");
  res.json(result.rows);
});

// GET a specific post by id
app.get("/posts/:id", async (req, res) => {
  const result = await db.query("SELECT * FROM posts WHERE id = $1", [req.params.id]);
  const post = result.rows[0];
  if (!post) {
    res.status(404).json({ message: 'Post not found' });
  } else {
    res.json(post);
  }
});

function getDate() {
  const date = new Date();
  const day = date.getDate(); // Get day of the month
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear(); 

  const formattedDate = `${day} ${month} ${year}`;
  return formattedDate;
}

// POST a new post
app.post("/posts", async (req, res) => {
  const post = {
    title: req.body.title,
    content: req.body.content,
    date: getDate(),
  };
  try {
    await db.query(
      "INSERT INTO posts (title, content, time) VALUES ($1, $2, $3)",
      [post.title, post.content, post.date]
    );
    res.status(201).json(post);
  } catch (err) {
    console.log(err);
  }

});
// ddb://econify-econify.h.aivencloud.com:11088/defaultdb?sslmode=require
// PATCH a post when you just want to update one parameter
app.patch("/posts/:id", async (req, res) => {
  try {
    const result = await db.query(
      "UPDATE posts SET title = COALESCE($1, title), content = COALESCE($2, content) WHERE id = $3 RETURNING *",
      [req.body.title, req.body.content, parseInt(req.params.id)]
    );
    if (result.rows.length === 0){ 
    res.status(404).json({ message: "Post not found" });
  }else{
    res.json(result.rows[0]);
  }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating post" });
  }
});

// DELETE a specific post by providing the post id
app.delete("/posts/:id", async (req, res) => {
  try {
    const result = await db.query("DELETE FROM posts WHERE id = $1", [parseInt(req.params.id)]);
    if (result.rowCount === 0) return res.status(404).json({ message: "Post not found" });

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error deleting post" });
  }
});
app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});

process.on('exit', () => {
  db.end();
});
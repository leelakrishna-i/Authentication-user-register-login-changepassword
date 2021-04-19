const bcrypt = require("bcrypt");
const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const dbPath = path.join(__dirname, "userData.db");

app.use(express.json());

let db = null;

//create database and start server

const createDbAndStartServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`SERVER IS RUNNING AT http://localhost:3000/`);
    });
  } catch (error) {
    console.log(`DATABASE ERROR ${error.message}`);
    process.exit(1);
  }
};

createDbAndStartServer();

//register user
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const userCheckQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userData = await db.get(userCheckQuery);
  if (userData === undefined) {
    if (password.length < 5) {
      response.statusCode = 400;
      response.send("Password is too short");
    } else {
      const uerRegisterQuery = `INSERT INTO user (username,name,password,gender,location)
       VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;

      await db.run(uerRegisterQuery);
      response.send(`User created successfully`);
    }
  } else {
    response.statusCode = 400;
    response.send("User already exists");
  }
});

//login check
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userData = await db.get(checkUserQuery);
  if (userData === undefined) {
    response.statusCode = 400;
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (passwordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userData = await db.get(checkUserQuery);

  if (userData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordMatch = await bcrypt.compare(oldPassword, userData.password);
    if (passwordMatch === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`;

        await db.run(updatePasswordQuery);
        response.statusCode = 200;
        response.send("Password updated");
      }
    } else {
      response.statusCode = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;

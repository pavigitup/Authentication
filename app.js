const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log("Server Running at http://localhost:3000/");
    process.exit(1);
  }
};
initializeDBAndServer();

//If the username already exists
//If the registrant provides a password with less than 5 characters
//Successful registration of the registrant

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  if (password.length <= 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const checkUser = `
  SELECT *
  FROM user
  WHERE username = '${username}';
  `;
    const result = await db.get(checkUser);

    if (result === undefined) {
      const createUser = `
        INSERT INTO user(username , name, password, gender, location)
        VALUES( '${username}',
        '${name}',
       '${hashedPassword}',
       '${gender}',
         '${location}');
      
        `;
      await db.run(createUser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

//If an unregistered user tries to login
//If the user provides incorrect password
//Successful login of the user

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUser = `
    SELECT *
    FROM user
    WHERE username = '${username}';
    `;
  const user = await db.get(checkUser);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.send("Login success!");
    }
  }
});

//Change Password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const checkUser = `
  SELECT *
  FROM user
  WHERE username = '${username}';
  `;
  const user = await db.get(checkUser);
  if (user === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const checkPassword = await bcrypt.compare(oldPassword, user.password);
    if (checkPassword === true) {
      if (newPassword.length <= 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `
              UPDATE user
              SET password = '${encryptedPassword}'
              WHERE username = '${username}';
              `;
        await db.run(updatePassword);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;

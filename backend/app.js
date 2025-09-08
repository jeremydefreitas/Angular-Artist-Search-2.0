require("dotenv").config();
const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
const port = parseInt(process.env.PORT) || 8080;
const authDetails = {};
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
app.use(
  cors({
    origin: ["http://localhost:4200", "https://jeremy-defreitas-hw3-570.uw.r.appspot.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static("dist/571-hw3/browser"));
app.use(cookieParser());

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/artist-search";
const client = new MongoClient(uri);
const db = client.db("HW3");
const users = db.collection("users");
const favorites = db.collection("favorites");
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";

async function generate_key(clientID, clientSecret) {
  try {
    const response = await axios.post(
      "https://api.artsy.net/api/tokens/xapp_token",
      {
        client_id: clientID,
        client_secret: clientSecret,
      }
    );
    authDetails.token = response.data.token;
    authDetails.expires_at = response.data.expires_at;
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

if (
  authDetails.token === undefined ||
  authDetails.expires_at === undefined ||
  authDetails.expires_at >= Date.now()
) {
  (async () => {
    console.log("Generating new token");
    await generate_key(clientID, clientSecret);
  })();
}

app.get("/api/artist-search/:artist_name", async (req, res) => {
  const artistName = req.params.artist_name ?? "";
  try {
    const response = await axios.get(
      `https://api.artsy.net/api/search?q=${artistName}&size=10`,
      {
        headers: {
          "X-Xapp-Token": authDetails.token,
        },
      }
    );
    res.send(response.data._embedded.results);
  } catch (error) {
    console.error(error);
  }
});

app.get("/api/artist-details/:artist_id", async (req, res) => {
  const artistId = req.params.artist_id ?? "";
  try {
    const response = await axios.get(
      `https://api.artsy.net/api/artists/${artistId}`,
      {
        headers: {
          "X-Xapp-Token": authDetails.token,
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.sendStatus(error.status);
  }
});

app.get("/api/similar-artist/:artist_id", async (req, res) => {
  const artistId = req.params.artist_id ?? "";
  try {
    const response = await axios.get(
      `https://api.artsy.net/api/artists?similar_to_artist_id=${artistId}`,
      {
        headers: {
          "X-Xapp-Token": authDetails.token,
        },
      }
    );
    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.sendStatus(error.status);
  }
});

app.get("/api/artworks/:artist_id", async (req, res) => {
  const artistId = req.params.artist_id ?? "";
  try {
    const response = await axios.get(
      `https://api.artsy.net/api/artworks?artist_id=${artistId}&size=10`,
      {
        headers: {
          "X-Xapp-Token": authDetails.token,
        },
      }
    );
    res.send(response.data._embedded.artworks);
  } catch (error) {
    console.error(error);
    res.sendStatus(error.status);
  }
});

app.get("/api/genes/:artwork_id", async (req, res) => {
  const artworkId = req.params.artwork_id ?? "";
  try {
    const response = await axios.get(
      `https://api.artsy.net/api/genes?q=${artworkId}`,
      {
        headers: {
          "X-Xapp-Token": authDetails.token,
        },
      }
    );
    res.send(response.data._embedded.genes);
  } catch (error) {
    console.error(error);
    res.sendStatus(error.status);
  }
});

app.post("/api/register", async (req, res) => {
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res
      .status(400)
      .json({ message: "Fullname, email and password are required" });
  }

  if (!email || typeof email !== "string") {
    throw new Error("Email must be a non-empty string");
  }
  const existingUser = await users.findOne({ email: email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User with this email already exists." });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const emailForHashing = email.toLowerCase().trim();

  const hashedEmail = crypto
    .createHash("sha256")
    .update(emailForHashing)
    .digest("hex");

  await users.insertOne({
    fullname,
    email,
    password: hashedPassword,
    profileImageUrl: `https://www.gravatar.com/avatar/${hashedEmail}?s=200&d=identicon`,
    favorites: [],
  });

  res.json({ message: "User registered successfully" });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await users.findOne({ email: email });

  if (!user) {
    return res.status(400).json({ message: "Password or email is incorrect." });
  }

  if (!user.password) {
    return res.status(500).json({ message: "Password or email is incorrect." });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Password or email is incorrect." });
  }

  const name = user.fullname;
  const profileImageUrl = user.profileImageUrl;
  const isAuthenticated = true;

  const token = jwt.sign(
    { email, name, profileImageUrl, isAuthenticated },
    SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );

  res.cookie("auth-token", token, {
    httpOnly: true,
    secure: "false",
    sameSite: "Lax",
    maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
  });

  res.json({ message: "Login successful" });
});

app.post("/api/logout", (req, res) => {
  delete req.session;
  res.clearCookie("auth-token");
  res.end();
});

app.get("/me", (req, res) => {
  const token = req.cookies?.["auth-token"];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({
      email: decoded.email,
      name: decoded.name,
      profileImageUrl: decoded.profileImageUrl,
      isAuthenticated: decoded.isAuthenticated,
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

app.post("/api/add-favourite/:id", async (req, res) => {
  const { email } = req.body;
  if (!req.params.id || typeof req.params.id !== "string") {
    return res.status(400).json({ message: "Invalid artist ID" });
  }
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ message: "Artist ID is required" });
  }

  const data = await users.updateOne(
    { email: email },
    {
      $push: {
        favorites: {
          artist_id: id,
          added_at: new Date(),
        },
      },
    },
    { upsert: true }
  );

  if (data.modifiedCount === 0) {
    return res.status(500).json({ message: "Error adding favorite" });
  }

  res.status(200).json({
    message: "Favourite added successfully",
  });
});

app.delete("/api/remove-favorite/:id", async (req, res) => {
  const { email } = req.body;
  const user = await users.findOne({ email: email });
  const id = req.params.id ?? "";

  try {
    const test = await users.updateOne(
      { email: email },
      {
        $pull: {
          favorites: { artist_id: id },
        },
      }
    );

    res.status(200).json({
      message: "Favourite removed successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Error removing favorite", error });
  }
});

app.delete("/api/delete-account", async (req, res) => {
  const { email } = req.body;

  try {
    await users.deleteOne({ email: email });
    res.status(200).json({
      message: "Account deleted.",
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error });
  }
});

app.get("/api/favorites/:email", async (req, res) => {
  const email = req.params.email ?? "";
  const user = await users.findOne({ email: email });

  res.json({
    favorites: user ? user.favorites : [],
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

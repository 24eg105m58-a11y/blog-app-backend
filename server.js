import exp from "express";
import { config } from "dotenv";
import mongoose from "mongoose";
import { userApp } from "./APIs/UserAPI.js";
import { authorApp } from "./APIs/AuthorAPI.js";
import { adminApp } from "./APIs/AdminAPI.js";
import { commonApp } from "./APIs/CommonAPI.js";
import cookieParser from "cookie-parser";
import cors from "cors";

config();

// create express app
const app = exp();

// ================= CORS =================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://your-frontend.vercel.app",
    ],
    credentials: true,
  })
);

// ================= MIDDLEWARES =================
app.use(cookieParser());
app.use(exp.json());

// ================= ROOT ROUTE =================
app.get("/", (req, res) => {
  res.send("Backend running successfully");
});

// ================= API ROUTES =================
app.use("/user-api", userApp);
app.use("/author-api", authorApp);
app.use("/admin-api", adminApp);
app.use("/auth", commonApp);

// ================= INVALID PATH =================
app.use((req, res) => {
  res.status(404).json({
    message: `Path ${req.url} is invalid`,
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.log("Error:", err);

  // ValidationError
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      error: err.message,
    });
  }

  // CastError
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Cast Error",
      error: err.message,
    });
  }

  // Duplicate key error
  const errCode =
    err.code ?? err.cause?.code ?? err.errorResponse?.code;

  const keyValue =
    err.keyValue ??
    err.cause?.keyValue ??
    err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];

    return res.status(409).json({
      message: "Duplicate field error",
      error: `${field} "${value}" already exists`,
    });
  }

  // Server error
  res.status(500).json({
    message: "Server side error",
    error: err.message,
  });
});

// ================= DATABASE CONNECTION =================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);

    console.log("DB server connected");

    // PORT
    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (err) {
    console.log("Error in DB connection:", err);
  }
};

connectDB();
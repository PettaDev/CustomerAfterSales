import app from "./app.mjs";
import express from "express";
import path from "node:path";
app.use(express.static("dist"));
app.get("/{*path}", (req, res) =>
  res.sendFile(path.resolve("dist/index.html")),
);
app.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
  console.log("Portal API http://127.0.0.1:3001"),
);

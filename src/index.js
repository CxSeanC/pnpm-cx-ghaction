const express = require("express");
const chalk = require("chalk");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  const id = uuidv4();
  console.log(chalk.green(`Request received - ID: ${id}`));

  const response = await axios.get("https://jsonplaceholder.typicode.com/todos/1");
  res.json({ id, todo: response.data });
});

app.listen(PORT, () => {
  console.log(chalk.blue(`Server running on port ${PORT}`));
});
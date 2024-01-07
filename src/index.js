import dotenv from "dotenv";
import httpServer from "./server.js";
import connectDB from "./db/index.js";

// dotenv.config({
//   path: "./.env",
// });
const startServer = () => {
  httpServer.listen(process.env.PORT || 8080, () => {
    console.log("⚙️  Server is running on port: " + process.env.PORT || 8080);
  });
};

// connect to db if done then start server else don't
connectDB()
  .then(() => {
    startServer();
  })
  .catch((e) => {
    console.log("mongo db connect error: ", e);
  });

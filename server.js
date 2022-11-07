require ('dotenv').config({path:"./config.env"});
const express=require('express');
const app = express();
const connectDB=require("./config/db");
const errorHandler=require("./middleware/error");

const PORT=process.env.PORT||5000;
connectDB();

app.use(express.json());
app.get("/", (req, res, next) => {
    res.send("Api running");
  });
app.use("/api/auth",require("./routes/auth.js"));
app.use("/api/private",require("./routes/private.js"));
app.use(errorHandler);

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
});
process.on("unhandledRejection",(err,promise)=>{
    console.log(`Logged Error:${err}`);
    server.close(()=>process.exit(1));
});
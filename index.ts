import express from 'express'
import dotenv from 'dotenv'
import fileUploadRouter from './routes/fileUpload';
const app = express();
dotenv.config();
app.use(express.json());
// app.use(exp)
app.use(fileUploadRouter);
const PORT = 5000;
app.listen(PORT,"0.0.0.0", ()=>{
    console.log("Working at port ", PORT);
})

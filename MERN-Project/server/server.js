import express from 'express'
import cors from 'cors'
import 'dotenv/config';
import cookieparser from "cookie-parser";
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js'
import userRouter from './routes/userRoutes.js';

const app=express();
const port =process.env.PORT || 8080
connectDB()

//frontend URL
const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieparser())
app.use(cors({ origin: allowedOrigins, credentials:true}))


//API Endpoints

app.get('/',(req,resp)=>resp.send("API Working fine...!"));
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)

app.listen(port,()=>console.log(`Server Started on PORT:${port} `));


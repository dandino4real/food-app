import express from 'express';
import logger from "morgan";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user"
import vendorRouter from './routes/vendor';

import {db} from './config/index';

import dotenv from 'dotenv'
import indexRouter from './routes';
import adminRouter from './routes/admin';
dotenv.config()

const app = express();


db.sync().then(()=>{
    console.log("db connected successfully");
}).catch(err=> console.log(err)
)


app.use(express.json());
app.use(logger("dev"));
app.use(cookieParser());

//Router middleware
app.use('/', indexRouter)
app.use('/users', userRouter)
app.use('/vendor', vendorRouter)
app.use('/admins', adminRouter)




const port = 4000
app.listen(port, ()=>{
    console.log(`server running on port http://localhost:${port}`);
});


export default app;
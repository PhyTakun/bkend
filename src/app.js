import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';


const app = express () // configuration takes places, after this line

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true, // explore cors


})) // .use, is use for middleware or configuring. Here, configuring CORS policy


// request can come in may ways: from URL, JSON, in request BODY , submitting form. So, configuring these too

app.use(express.json({
    limit : "16kb"
}))  // accepting json and allowing 16kb of size

app.use(express.urlencoded({ extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())



// routes

import userRouter from './routes/user.routes.js'

// routes declaration

app.use("/api/v1/users", userRouter)

export {app}


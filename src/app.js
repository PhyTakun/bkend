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
import commentRouter from "./routes/comment.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"


// routes declaration

app.use("/api/v1/users", userRouter)
app.use("/api/v1/comments", commentRouter)
app.use("api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("api/v1/videos",videoRouter)


export {app}


import dotenv from "dotenv";
import connectDB from './db/index.js'
import { app } from "./app.js";

dotenv.config({
    path: './env'
})


connectDB() // as it's a async method it returns a promise 
.then(() =>{ // after DB connection is established , we start the server 

    // include app.on part too
    app.listen(process.env.PORT || 8000) // if not first then second execute 
    console.log(`Server is running at port : ${process.env.PORT}`)
}
)
.catch((err) => {

    console.log("Mongo DB connection FAILED", err)

})











// changes made in .env file, doesn't restart the db connection by mongoose, it must be restarted manually 

/*
import express from 'express';

const app = express();  


(async () => {

    try {

       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on('error',(error)=> {
            console.log(error);
            throw error;
            
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening to Port: ${process.env.PORT}`); // this line will not execute I believe
                                                                         // if try block errors out
            
        })
        
    } catch (error) {

        console.error("Error",error);
        throw error;
        
    }

})()

*/
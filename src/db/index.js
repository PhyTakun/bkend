import mongoose from "mongoose";

import { DB_NAME } from "../constant.js";

const connectDB = async () => {

    try {
           const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) // read more about this
           console.log(`\n Mongo DB Connected !! DB HOST: ${connectionInstance.connection.host}`); 
           

    } catch (error) {

        console.log("MongoDB Connection FAILED ",error)
        process.exit(1) // read about process
        
    }
 
}


export default connectDB 
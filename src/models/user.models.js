    import mongoose, {Schema} from "mongoose";
    import bcrypt from bcrypt;
    import jwt from "jsonwebtoken"

    const userSchema = new Schema({

        username: {
            type: String,
            require: true,
            unique : true,
            lowercase: true,
            trim : true,
            index : true // make it more optimize for searching, consume resources and time
        },

            email: {
            type: String,
            require: true,
            unique : true,
            lowercase: true,
            trim : true,
        },

            fullName: {
            type: String,
            require: true,
            trim : true,
            index: true
        },

        avatar: {
            type: String, // cloudinary url
            required : true 
        },

            coverImage: {
            type: String, // cloudinary url
        },

        watchHistory :
        [ {
            type: Schema.Types.ObjectId,
            ref: "Video"
        } ], 

        password: {
            type: String,
            required: [true, "Password is required"]
        },

        refreshToken : {
            type: String
        }
    },
        {
            timestamps: true
        })


userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 10)
    next()
})  // before the data is saved pre function acts and save the password in an encrypted format

userSchema.method.isPasswordCorrect = async function (password) { // allows to use own custom methods
    
    return await bcrypt.compare(password, this.password) // validating pwd

}

userSchema.methods.generateAccessToken = function()
{
    return jwt.sign(
        {

        _id: this.id,
        email : this.email,
        username : this.username,
        fullName : this.fullName
    },

    process.env.ACCESS_TOKEN_SECRET,

    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)

}

userSchema.methods.generateRefreshToken = function()
{
    return jwt.sign(
        {

        _id: this.id,
    },

    process.env.REFRESH_TOKEN_SECRET,

    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)

}
    
export const User = mongoose.model("User", userSchema)
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import  {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) => { // reason for making this is that it will used a lot.
    // There are scenarios when we have to generate both of them together, hence make a function of it.

    try {

        const user = await User.findById(userId) 
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

       await user.save({ validateBeforeSave : false })

       return {accessToken , refreshToken}
        
    } catch (error) {

        throw new ApiError(500, "Something went wrong while generating Access and Refresh token")
        
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const {fullName, email, username, password} =  req.body 

    if ([fullName, email, username, password].some((field) => field?.trim() === ""
    )){

        throw new ApiError(400, "All field are required")

    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser) {
        throw new  ApiError(409, "Email or Username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath; // because of scope issue - what? 

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {

        coverImageLocalPath = req.files.coverImage[0].path
        
    }

    if (!avatarLocalPath) {
        
        throw new ApiError(400, "Avatar file is required! ")
    
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

     const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken")

    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return  res.status(201).json(
        new ApiResponse(200,createdUser, "User Registered successfully")
    )

})      


const loginUser = asyncHandler(async (req,res) => {

    //algo

    // read the data from request body
    // user or email based checking of user
    // find the user 
        // if user is found move to next step
        // else prompt an error response
    // password check
        // if fails prompt an error response
    // send  access and refresh tokens
    // send them through secure ccookies 

    const {username,email,password} = req.body;

    if (!(username || email))
    {
        throw new ApiError(400, "Username or email is required ")
    }

    const userinfo = await User.findOne({
        $or: [{username} , {email}]
    })
    
    if (!userinfo) {

        throw new ApiError(404, "User does not exist");
        
    }

    const isPasswordValid =  await userinfo.isPasswordCorrect(password)

    if (!isPasswordValid) {

        throw new ApiError(401, "Invalid user credentials");
        
    }


    const {accessToken , refreshToken } = await generateAccessAndRefreshTokens(userinfo._id)

    const loggedInUser = await User.findById(userinfo._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse( // because application can't handle ccookie? and user storing it locally
            200,
            {
                user: loggedInUser, accessToken , refreshToken
            },
            "User logged in Successfully! "
        )
    )
})


const logoutUser = asyncHandler(async(req,res) => {

        User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken : undefined
                }
            }
        )

        const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User logged out"))
})


const refreshAccessToken = asyncHandler(async(req,res)=> {

   const incomingRefreshToken =  req.cookies?.refreshToken || req.body.refreshToken; 

   if (!incomingRefreshToken) {

    throw new ApiError(401, "Unauthorized request")
    
   }
   //why will someone send a refreshToken in a json body?

   try {

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET) //decoded token

    const user = await User.findById(decodedToken?._id) // extracted user document

    if (!user) {

        throw new ApiError(401, "Invalid Refresh Token") // the error can occuer because of a fault it decoding,
                                                        // refreshtoken payload is corrupted or the user doesn't exist
        
    }

            
    if (incomingRefreshToken !== user?.refreshToken) {

        throw new ApiError(401, "Refresh token is expired or used");    // user exist, however refreshtokesn
                                                                        // don't match
    }


    const options = {
        httpOnly : true,
        secure : true
    }

    const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"
        )
    )
    


   } catch (error) {

    throw new ApiError(401, error?.message || "Invalid refresh token")
    
   }
})


const changeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldPassword, newPassword}= req.body

    // finding a way to match is the old pwd is equal to the one entered by the user
    const user = await User.findById(req.user?._id)

    //if (!(user.password !== oldPassword)) will not work, because the pwd stored in db is encrypted

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) 

    if(!isPasswordCorrect)
    {
        throw new ApiError(400, "Invalid old Password")
    }
    
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req, res)=> {

    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {

    const {fullName, email} = req.body

    if(!fullName || !email) 
    {
        throw new ApiError(400, "All fields are required");
        
    }
    
    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                    fullName,
                    email  // can also be written as email:email, only when both the key and value have same name
                    
            }
        },

        {new:true} // sends back the new user object with updated fields 

    ).select("-password")

    return res
    .status(200)
    .json(200,user, "Account details updated successfully")

})


const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        
        throw new ApiError(400, "Error while uploading the file")
    }


   const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },

        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json( new ApiResponse(200, user, "Avatar image updated successfully"))
})


const updateUserCoverImage = asyncHandler(async(req,res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {

        throw new ApiError(400,"Cover Image file is missing")
        
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url)
    {
        throw new ApiError(400,"Error while uploading the file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage : coverImage.url
            }
        },

        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"))
})


const getUserChannelProfile = asyncHandler(async(req,res)=> {

    const {username} = req.params

    if (!username?.trim()) {

        throw new ApiError(400, "username is missing")
        
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()  // fetch all the docs which match this username
                                                    // in this case here, only one 
            }
        },

        {
            // left join, add the docs as field in the user's doc (current one) that match the _id field
            // this gives all the subscribers
            // understading the subscription model is important for the below two lookups
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField:"channel",
                as: "subscribers"
            }
        },

        {  // all the subsciptions 
            $lookup : {
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedTo"
            }
    },

    {
        $addFields : {

            subscriberCount : {
                $size: "$subscribers"
            },

            channelSubscribeToCount : {
                $size : "$subscribedTo"
            },

            isSubscribed : {

                $cond: {
                    if: {$in: [req.user._id, "$subscribers.subscriber"]}, // subscribers.subscriber" So when someone asks 
                    // "what's that dot notation thing?"
                    //  you can say it's "array field path extraction" or just "field path" for short!
                    then: true,
                    else: false
                }
            }

        }
    },
    {
        $project : {
            fullName: 1,
            username: 1,
            subscriberCount : 1,
            channelSubscribeToCount : 1,
            isSubscribed : 1,
            avatar : 1,
            coverImage : 1,
            email : 1
        }
    }
    ])

    if(!channel?.length)
    {
        throw new ApiError(400, "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})

const getWatchHistory = asyncHandler(async (req,res) => {

    const user = User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },

        {
            $lookup : {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "WatchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owners",
                            pipeline : [
                                {
                                    $project : {
                                        fullName :1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                         $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                         }
                    }
                ]
            }
        }
    ])


    return res
    .status(200)
    .json( new ApiResponse( 200, user[0].WatchHistory, "watch histroy successfully fetched"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
    
}

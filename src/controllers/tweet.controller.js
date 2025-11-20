import mongoose from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const {content} = req.body
    const userID = req.user._id // mistakes made here: const {userID} = req.user

    if(!content || content.trim() === '')
        {
            throw new ApiError(400, "Tweet content is required")
        }

    
    const tweetCreated = await Tweet.create(
        {
            content : content,
            owner : userID
        }

     /*   {
            new : true 
        }
            2. Tweet.create() doesn't accept {new: true} option
                The {new: true} option is for findOneAndUpdate(), not create(). Remove it:
    */
    )

    if(!tweetCreated)
        {
            throw new ApiError(500, "Tweet creation failed. Try again")
        }

    res
    .status(200)
    .json( new ApiResponse(200, tweetCreated ,"Tweet created successfully!"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userID = req.user._id

    // const allTweets = await Tweet.findById(userID) made mistake here, searched by find by ID, we've owner ID not tweet ID

    const allTweets = await Tweet.find(
        {
            owner : userID
        }
    )

    if(!allTweets || allTweets.length === 0)
        {
            throw new ApiError(404, "No tweets retrieved.")
            // If no tweets found, it's not a server error (500). It's a valid scenario. Either return empty array or use 404:
        }

    res
    .status(200)
    .json( new ApiResponse(200, allTweets, "Tweets successfully fetched"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {tweetID} = req.params 
    const {content} = req.body


    if(!content || content.trim() === '') 
        {  // didn't add initally 

    throw new ApiError(400, "Tweet content is required")
        }

    if(!mongoose.Types.ObjectId.isValid(tweetID))
        {
            throw new ApiError(400, "Invalid Tweet ID")
        }

    const tweetExist = await Tweet.findById(tweetID)

    if(!tweetExist)
        {
            throw new ApiError(404, "Tweet does not exist")
        }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetID,
        {
            content :content
        },

        {
            new : true
        }
    )

    res
    .status(200)
    .json(new ApiResponse(200,updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const {tweetID} = req.params 

    if(!mongoose.Types.ObjectId.isValid(tweetID))
    {
        throw new ApiError(400, "Invalid Tweet ID")
    }

    const tweetExist = await Tweet.findById(tweetID)

    if(!tweetExist)
        {
            throw new ApiError(404, "Tweet does not exist")
        }

    try {

        await Tweet.findByIdAndDelete(tweetID)
        
    } catch (error) {

        throw new ApiError(500, "Unable to delete tweet. Try again")
        
    }

    res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet successfully deleted"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
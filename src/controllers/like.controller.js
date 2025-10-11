import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Video } from "../models/video.models.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(videoId))
        {
            throw new ApiError(400, "Invalid video ID")
        }

    const videoExist = await Video.findById(videoId)
    if(!videoExist)
        {
            throw new ApiError(400, "Video does not exist")
        }

    let isLiked
    let isMessage

    const existingLike = await Like.findOne(
            {
                video: videoId,
                likedBy : userId
            }
    )

    if(!existingLike)
        {
            await Like.create({
                video : videoId,
                likedBy : userId
            })

            isLiked = true
            isMessage = "Video is liked"
        }

    else 
        {
            await Like.findByIdAndDelete(existingLike._id)

            isLiked = false
            isMessage = "Video is unliked"
        }

    res
    .status(200)
    .json(new ApiResponse(200, {isLiked}, isMessage))
        

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id

    const commentExist = await Comment.findById(commentId)

    if(!commentExist)
        {
            throw new ApiError(400,"Comment does not exist")
        }

    const commentLiked = await Like.findOne(
        {
            comment : commentId,
            likedBy : userId
        }

    )

    let isLiked;
    let isMessage;


    if(!commentLiked)
        {
            await Like.create(
                {
                    comment : commentId,
                    likedBy : userId
                }
            )

            isLiked = true;
            isMessage = "Comment is liked"
        }
    
    else
        {
            await Like.findByIdAndDelete(commentLiked._id)

            isLiked = false;
            isMessage= "Comment unliked successfully"
        }

    res.status(200).json(
        new ApiResponse(200, isLiked, isMessage)
    )
        
})



const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {userId} = req.user._id
    //TODO: toggle like on tweet

    const tweetExist = await Tweet.findById(tweetId)

    if(!tweetExist)
        {
            throw new ApiError(400, "Tweet does not exist")
        }

    const tweetLikeExist = await Like.findOne(
        {
            tweet: tweetId,
            likedBy: userId
        }
    )

    let isLiked; 
    let isMessage;

    if(!tweetLikeExist)
        {
            await Like.create(
                {
                    tweet: tweetId,
                    likedBy: userId
                }
            )

            isLiked = true;
            isMessage = "Tweet is liked"
        }

    else
        {
            await Like.findByIdAndDelete(tweetLikeExist._id)

            isLiked = false
            isMessage = "Tweet is unliked"
        }

        res.status(200).json(
        new ApiResponse(200, isLiked, isMessage)
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user._id

    const filteredData = await Like.aggregate(
        [
        
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(userId),
                video : {
                    $ne : null
                }
            }

        },

        {
            $sort : {
                createdAt : -1
            }
        },

        { 
            $facet : {

                videos : [

            {
                $lookup : {
                    from : "videos",
                    localField: "video",
                    foreignField: "_id",
                    as : "videoDetails",
                    pipeline : [
                    {
                        $lookup : {
                        from : "users",
                        localField : "owner",
                        foreignField: "_id",
                        as : "ownerDetails"
                        } 
                    },

                    {
                        $unwind: {
                            path : "ownerDetails"
                        }
                    }

                    ]
                }
            },

            {
                $unwind : {
                    path : "$videoDetails"
                }
            },

            {
                $project : {
                    _id : "$videoDetails._id",
                    thumbnail : "$videoDetails.thumbnail",
                    title : "$videoDetails.title",
                    description : "$videoDetails.description",
                    duration : "$videoDetails.duration",
                    views : "$videoDetails.views",
                    createdAt : "$videoDetails.createdAt",
                    likedAt : "$createdAt",
                    owner : {
                        _id : "$videoDetails.ownerDetails._id",
                        username : "$videoDetails.ownerDetails.username",
                        avatar : "$videoDetails.ownerDetails.avatar"
                    }
                } 
            }

        ],

        totalCount : [
                {
                    $count : "count"
                }
        ]

    } 
    } 
        
    ]



    )

    const {likedVideos, totalCount} = filteredData[0]

    const totalLikes = totalCount[0]?.count || 0 


    return res
    .status(200)
    .json(new ApiResponse(200,{likedVideos, totalLikes}, "Liked Videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
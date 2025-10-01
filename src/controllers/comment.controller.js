import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { application, response } from "express"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
    const aggregate = await Comment.aggregate([

        {
            $match: {
                video : new mongoose.Types.ObjectId(videoId) // find the new approach
            }
        },

        {
            $lookup : {
                from:"users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline : [
                    {
                        $project: {

                            username : 1,
                            fullName : 1,
                            avatar : 1
                        }
                    },
                ]
            }
         },

         {
            $addFields: {
                owner : {
                    $first: "$owner"
                }
            }
         },

         {
            $sort : {
                createdAt : -1
            }
         }
    ])

    const options = {
        page : parseInt(page),
        limit : parseInt(limit)
    }

    const allComments = await Comment.aggregatePaginate(aggregate,options)
    
    const responseData = {
        comments : allComments.docs, // array of comments objects
        pagination: {
            currentPage : allComments.page,
            totalPages : allComments.totalPages,
            totalComments : allComments.totalDocs,
            hasNextPage: allComments.hasNextPage,
            nextPage: allComments.nextPage,
            prevPage : allComments.prevPage,
            limit : allComments.limit
    }
    }

    return res
    .status(200)
    .json(new ApiResponse(200, responseData, `Page ${allComments.page} of ${allComments.totalPages}`)) // how data is sent back 
                                                                                                        // how a front end will fetch commentID of a single comment

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body 
    const {videoId} = req.params
    const {owner} = req?.user._id

    if(!content || content.trim() == "")
        {
            throw new ApiError(400, "No content served")
        }
    
    if(!mongoose.Types.ObjectId.isValid(videoId))  // understand format. form displays when user is logged, so a check placed in front - end ? 
        {
            throw new ApiError(400, "Invalid Video ID")
        }

    try {
        const comment = await Comment.create({
        content: content.trim(),
        video : videoId,
        owner : owner
        })

       } 
       catch (error) {

        throw new ApiError(500, "Failed to add comment" )
       }

    // if(!comment)
    // {
    //     throw new ApiError(500, "Comment not created")
    // } 

    // above line NEVER HITS, because create don't retun falsy value, but instead throw an error

    return res
    .status(201)
    .json(201, null, "Comment added successfully")

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentID} = req.params
    const {userID} = req?.user._id
    const {content} = req.body

    if(!mongoose.Types.ObjectId.isValid(commentID))
        {
            throw new ApiError(400, "Invalid Comment ID")
        }

    const comment = await Comment.findById(commentID)
    if(!commentID)
        {
            throw new ApiError(404, "Comment not found")
        } // race condition

    if(!content || content.trim() === "")
        {
            throw new ApiError(400, "Content is required")
        }

    if(comment.owner.toString() !== userID.toString())
        {
            throw new ApiError(403, "You can only update your own comments!")   // the action of click on edit and chaging content is already performed,
                                                                                // however after this happens, server send back a response that can't change other comments
                                                                                // what will happen after that, reloading the whole page? 
                                                                                // a front end check, if the comment doesn't belong to user, the front - end will not give the 
                                                                                // option to edit. Similar to youtube
                                                                                // how's the check performed then? Already went thorough all the elements ? 
                                                                                // a server response, which consist of array of comments editable by logged in user and vice versa
                                                                                // the fronted end then make elements on the basis of check

        }

    const updatedComment = await Comment.findByIdAndUpdate(commentID,
        {content: content.trim()},
         {new : true}
        ).populate({
            path: owner,
            select : "username fullname avatar"
         })

    return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment update successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentID} = req.params
    const {ownerID} = req?.user._id

    if(!mongoose.Types.ObjectId.isValid(commentID))
        {
            throw new ApiError(400, "Comment ID is not valid")
        }

    const comment = await Comment.findById(commentID)
    if (!comment)
        {
            throw new ApiError(404, "Comment not found");
            
        }

    if(ownerID.toString() !== comment.owner.toString())
        {
            throw new ApiError(400, "You can only delete your own comment")
        }

    try {

        await Comment.findByIdAndDelete(commentID)
        
    } catch (error) {

        throw new ApiError(500, "Unable to delete comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"))


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
import mongoose, {isValidObjectId, set} from "mongoose"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  
    //TODO: get all videos based on query, sort, pagination

      const { page = 1, limit = 10, query, sortBy = "createdAt", sortType ="desc", userId } = req.query

    const pipeline = []

    const matchStage = 
    {
        isPublished : true
    }

    if(userId)
        {
            matchStage.owner = mongoose.Types.ObjectId(userId)
        }
    
    if(query)
        {
            matchStage.$or = [
                {title : {$regex: query , $options : "i"}},
                {description : {$regex : query, $options : "i"}}
            ]
        }
    pipeline.push({$match : matchStage})
    
    pipeline.push({
        $lookup : {
            $from : "users",
            localField : "owner",
            foreignField : "_id",
            as: "ownerDetails",

            pipeline : [
                {
                    $project : {
                        username : 1, 
                        fullName : 1,
                        avatar : 1 
                    }
                }
            ]
        }
    })

    pipeline.push({
        $unwind : {
            path : "$ownerDetails",
            preserveNullAndEmptyArrays : true
        }
    })

    const sortOrder = sortType = "asc" ? 1 : -1 

    pipeline.push({
        $sort : {
            [sortBy] : sortOrder
        }
    })

    pipeline.push({
        $project : {

            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
            createdAt: 1,
            ownerDetails: 1
        }
    })

    const options = {
        page : parseInt(page, 10),
        limit : parseInt(limit, 10)
    }

    const allVideos = await Video.aggregatePaginate(pipeline, options)

        return res.status(200).json(
        new ApiResponse(
            200,
            allVideos,
            "Videos fetched successfully"
        )
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!title || !description) 
        {
            throw new ApiError(400, "Both title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoLocalPath)
        {
            throw new ApiError(400, "Video file is required")
        }

    const videoFile = await uploadOnCloudinary(videoLocalPath)

    if(!videoFile)
        {
            throw new ApiError(500, "Failed to upload on cloudinary")
        }

    let thumbnailFile = null

    if(thumbnailLocalPath)
        {
            thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)
        }

    
    const videoCreated = await Video.create({

        title,
        description,
        videoFile : videoFile?.url,
        thumbnail : thumbnailFile?.url || "",
        duration : videoFile?.duration,
        owner : req.user?._id

    })

    if(!videoCreated)
        {
            throw new ApiError(500, "Something went wrong while creating video")
        }

    res
    .status(200)
    .json(new ApiResponse(200, videoCreated, "Video published successfully"))

    })

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    // if(!videoId)
    //     {
    //         throw new ApiError(400, "Video ID is not provided")
    //     }

    if(!mongoose.Types.ObjectId.isValid(videoId))
        {
            throw new ApiError(400, "Invalid Video ID")
        }

    try {

        const fetchedVideo = await Video.findById(videoId)
        } 
    
        catch (error) {

            throw new ApiError(500, "Unable to fetch video, Try again");
            
        
    } 

    if(!fetchedVideo)
        {
            throw new ApiError(404, "Video not found");
             
        }

    res
    .status(200)
    .json(new ApiResponse(200, fetchedVideo, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description} = req.body
    const thumbnailLocalPath = req.file?.path

    if(!(title || description || thumbnailLocalPath))
        {
            throw new ApiError(400, "At least one field:  title, description or thumbnail is required");
            
        }

    const unchangedVideo = await Video.findById(videoId)

    if(!unchangedVideo)
        {
            throw new ApiError(404, "Video does not exist")
        }

    if(unchangedVideo.owner.toString() !== req.user?._id.toString())  // user's logged is validated through verifyJWT, however 
                                                                        // it's unknown whether it's owned by the user or not, hence auth check
        {
            throw new ApiError(403, "You are not authorized to update this video")
        }
    
    let thumbnailFile = null

    if(thumbnailLocalPath)
        {
            thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

            if(!thumbnailFile)
                {
                    throw new ApiError(500, "Failed to upload thumbnail")
                }
        }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { 
            $set: {
            title : title || unchangedVideo.title,
            description : description || unchangedVideo.description,
            thumbnail : thumbnailFile?.url || unchangedVideo.thumbnail

        }
    },

        {new : true}
    )
    
    
    if(!updatedVideo)
        {
            throw new ApiError(500, "Unable to update video, try again")
        }
    
    
    res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video details are successfully updated"))
    
    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!mongoose.Types.ObjectId.isValid(videoId))
        {
            throw new ApiError(400, "Invalid Video ID")
        }

    let deletedVideo = null;

    try {

        deletedVideo = await Video.findOneAndDelete(
            {
                _id: videoId,
                owner: req.user._id
            }
        )
        
    } catch (error) {

        throw new ApiError(500, "Unable to Delete Video, try again")
        
    }

    if (!deletedVideo) {

        throw new ApiError(404, "Video not found or you are not authorized to delete it!")
        
    }
    

    res
    .status(200)
    .json( new ApiResponse(200, {}, "Video successfully deleted!"))


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req?.user?._id

    if(!mongoose.Types.ObjectId.isValid(videoId))
        {
            throw new ApiError(400, "Invalid Video ID");
        }

    const updatePublishOfVideo = await Video.findOneAndUpdate(
        {
            _id: videoId,
            owner: userId
        },

        [
            {
                $set : {
                    isPublished : {$not : "$isPublished"}
                }
            }
        ],

        {new : true}
    )

    if(!updatePublishOfVideo)
    {
        throw new ApiError(404, "Video not found or you are not authorized")
    }

    res
    .status(200)
    .json(new ApiResponse(200, {}, `Video ${updatePublishOfVideo.isPublished ? 'published' : 'unpublished'} successfully`))
})




export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
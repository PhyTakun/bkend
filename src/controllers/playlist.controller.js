import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const ownerId = req.user._id


    if(!name || !description)
        {
            throw new ApiError(400, "Name and description are required")
        }

    const playlistExist = await Playlist.findOne(
        {
            name : name.trim(),
            owner: ownerId
        }
    )

    if(playlistExist)
        {
            throw new ApiError(400, "Playlist with a similar name already exist")
        }


    let createdPlaylist; 

    try {

        createdPlaylist = await Playlist.create(
        {
            name : name.trim(),
            description : description.trim(),
            owner : ownerId
        }
    )
        
    } catch (error) {

        throw new ApiError (500, "Failed to create a new Playlist. Try again")
    }

    res
    .status(200)
    .json(new ApiResponse(200, createdPlaylist,"Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    const userPlaylists = await Playlist.aggregate(
        [
            {
                $match : {
                    owner : userId
                }
            },

            {
                $lookup : {
                    from: "videos",
                    localField : "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                    pipeline : [
                        {
                            $project : {
                                thumbnail : 1,
                                title : 1,
                                description : 1,
                                duration : 1,
                                views : 1
                            }
                        }
                    ]
                }
            },



            {
                $project : 
                {
                    name : 1,
                    description : 1,
                    videos : "$videoDetails"
                }
            }
        ]
    )


/*  ALTERNATIVE APPROACH WITH MAPS

  const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: userId
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: {
                    $map: {
                        input: "$videoDetails",
                        as: "video",
                        in: {
                            thumbnail: "$$video.thumbnail",
                            title: "$$video.title",
                            description: "$$video.description",
                            duration: "$$video.duration",
                            views: "$$video.views"
                        }
                    }
                }
            }
        }
    ]);

*/

    if(userPlaylists.length === 0 )
        {
            throw new ApiError(404, "No Playlist exist")
        }

    res
    .status(200)
    .json(new ApiResponse(200, userPlaylists, "Playlists are fetched"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!mongoose.Types.ObjectId.isValid(playlistId))
        {
            throw new ApiError(400, "Invalid Playlist ID")
        }

    const fetchedPlaylist = await Playlist.findById(playlistId)

    if(!fetchedPlaylist)
    {
        throw new ApiError(404, "Playlist not found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, fetchedPlaylist, "Playlist fetched successfully"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!mongoose.Types.ObjectId.isValid(playlistId))
        {
            throw new ApiError(400, "Invalid Playlist ID")

        }

    if(!mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400, "Invalid video ID")

    }

    const existedPlaylist = await Playlist.findById(playlistId)

    if(!existedPlaylist)
        {
            throw new ApiError(404, "Playlist does not exist")
        }
    
    if(existedPlaylist.videos.includes(videoId))
        {
            
            throw new ApiError(400, "Video already exist in playlist")
        }

    const updatingExistingPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push : {
                videos : videoId
            }
        },

        {new : true}
    )

    res
    .status(200)
    .json(200, updatingExistingPlaylist, "Video added successfully")

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400, "Invalid Playlist ID")

    }

    if(!mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400, "Invalid video ID")

    }

    const existedPlaylist = await Playlist.findById(playlistId)

    if(!existedPlaylist)
        {
            throw new ApiError(404, "Playlist does not exist")
        }

    
    if(!existedPlaylist.videos.includes(videoId)) // Unnecessary Video check — You don't need to check if the video exists in the Video collection. 
    // You only care if it exists in the playlist's videos array.
        {
            throw new ApiError(400, "Video does not exist in the playlist")
        }
    

        
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull : 
                {
                    videos : videoId
                }
            },
            {new : true}
        )

    res
    .status(200)
    json( new ApiResponse(200 ,updatedPlaylist, "Video is removed from playlist"))
    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!mongoose.Types.ObjectId.isValid(playlistId))
        {
            throw new ApiError(400, "Invalid playlist ID")
        }

    const playlistExist = await Playlist.findById(playlistId)

    if(!playlistExist)
        {
            throw new ApiError(404, "Playlist does not exist")
        }

    try {

        await Playlist.findByIdAndDelete(playlistId)
        
    } catch (error) {

        throw new ApiError(500, "Something went wrong during deletion operation")
        
    }

    res
    .status(200)
    .json(200, {}, "Playlist successfully deleted")

})  

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    const playlistExist = await Playlist.findById(playlistId)
    if(!playlistExist)
        {
            throw new ApiError(404, "Playlist does not exist")
        }

    if(!name && !description)
        {
            throw new ApiError(400, "At least one field (name of description) is required")
        }

    // this one is good, if any one field or both fields are given, this will take care
    const updateFields = {}
    if (name) updateFields.name = name
    if(description) updateFields.description = description

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set : updateFields // set only changes given field and leave rest unchanged, without $set, the whole document will be replaced
        }
    )

    if(!updatedPlaylist)
        {
            throw new ApiError(500, "Failed to update playlist, try again")
        }

    res
    .status(200)
    .json( new ApiResponse(200, updatedPlaylist, "Playlist successfully updated"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
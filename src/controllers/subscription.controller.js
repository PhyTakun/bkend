import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    // const {toggleState} = req.body  toggle operation should not rely on what front - end/ user sends. The check must be through DB side
    const userId  = req.user._id


    if (userId.toString() === channelId) 
        {
            throw new ApiError(400, "You cannot subscribe to yourself")
        
        }

    const existingSubscription = await Subscription.findOne(
        {
            subscriber: userId,
            channel : channelId
        }
    )

    let isSubscribed
    let message 


    if(existingSubscription)
        {
            await Subscription.findByIdAndDelete(existingSubscription._id)
            isSubscribed = false
            message = "Unsubscribed successfully"
        }
    else 
        {
            const Newsubscription = await Subscription.create({
                subscriber: userId,
                channel : channelId
            })

            if(!Newsubscription)
                {
                    throw new ApiError(501, "Unable to subscribe. Please try again ")
                }

            isSubscribed = true
            message = "Subscribed successfully"
        }

        return res
        .status(200)
        .json( new ApiResponse(
            200,
            {
                isSubscribed,
                channelId

            },
            message
        ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
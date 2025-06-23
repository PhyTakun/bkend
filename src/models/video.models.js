import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
{

    videoFile: {
        type: String, //cloudinary url
        required: true
    },
    thumbnail: {
        type: String, //cloudinary url
        required: true
    },
    title: {
        type: String, 
        required: true
    },
    description: {
        type: String, 
        required: true
    },
    duration: {
        type: Number, // also can be obtained through cloudinary or any 3rd party storage
        required: true
    },

    views : {
        type: Number,
        default: 0
    },

    isPublished: {
        type: Boolean,
        default: true
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

},

{
    timestamps: true
}
)

videoSchema.plugin(mongooseAggregatePaginate) // to use 3rd party methods/classes/plugins? 

export const Video = mongoose.model("Video", videoSchema)
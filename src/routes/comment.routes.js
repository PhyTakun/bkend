import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {    getVideoComments,addComment, updateComment, deleteComment} from "../controllers/comment.controller.js"

const router = Router()

router.use(verifyJWT) // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment)

router.route("/c/:commentID").patch(updateComment).delete(deleteComment)

export default router
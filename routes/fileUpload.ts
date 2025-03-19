import express from 'express'
import { validateRequest } from '../middleware/zodMiddleware';
import { processAndUploadFile } from '../controllers/fileUploadController';
import { uploadSchema } from '../models/zodModels';
import { upload } from '../config/multer';
const fileUploadRouter=express.Router();
fileUploadRouter.post(
    "/send-request",
    upload.fields([{ name: "image" }, { name: "video" }]),
    validateRequest(uploadSchema),
    processAndUploadFile
  );
  
export default fileUploadRouter;
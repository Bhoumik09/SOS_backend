import { supabase } from "../config/supabase";
import dotenv from "dotenv";
import { activeTimers } from "./globalConstants";
dotenv.config();
const HF_API_KEY = process.env.HF_API_KEY!;
const HF_MODEL_URL = process.env.HF_MODEL_URL!;

import {Client} from "@gradio/client";


// 🔥 Function to start broadcasting the request to nearby stations
if (!HF_API_KEY || !HF_MODEL_URL) {
  console.error("❌ Hugging Face API Key or Model URL is missing!");
  process.exit(1); // Exit process if API details are missing
}

// 🔥 Function to predict fire severity using Hugging Face API


// Define the response structure
interface PredictionResponse {
  label: string;
  confidence: number;
}

// Connect to the Gradio Model

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  console.log(R*c)
  return R * c; // Distance in km
};
export const predictFireSeverity=async(fileBuffer: Buffer): Promise<void>=> {
  try {
    console.log("📸 Processing fire severity prediction...");

    // Validate the image buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("❌ Invalid image buffer provided.");
    }

    // Send the image to the Gradio model
    // if (!response || !response.data) {
    //   throw new Error("❌ No valid response from Gradio API.");
    // }

    // console.log("🔥 Fire Severity Prediction Response:", response.data);

    // // Extract label and confidence
    // const { label, confidence } = response.data as PredictionResponse;

    // if (!label || typeof confidence !== "number") {
    //   throw new Error("❌ Unexpected response format.");
    // }

    // return {  label, confidence };
  } catch (error) {
    console.error("🔥 Gradio API error:", (error as Error).message);
    throw new Error("Failed to classify fire severity.");
  }
}

// 📂 Function to upload files to Supabase
export const uploadToSupabase = async (file: Express.Multer.File, folder: string) => {
  try {
    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;
    const bucketName = "sos"; // Supabase bucket name

    // Upload file to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, { contentType: file.mimetype });

    if (error) {
      console.error("❌ Supabase Upload Error:", error);
      throw new Error("File upload to Supabase failed.");
    }

    const { publicUrl } = supabase.storage.from(bucketName).getPublicUrl(filePath).data;
    
    if (!publicUrl) {
      throw new Error("Failed to retrieve public URL from Supabase.");
    }

    return publicUrl;
  } catch (err: any) {
    console.error("⚠️ Upload Error:", err.message);
    return null;
  }
};
export const startBroadCastTimer=(requestId:string)=>{
  console.log(requestId);
    console.log(`starting the broadcasting of request from timer ${requestId}`);
    if(activeTimers[requestId]){
        console.log("The request is already being broadcasted");
        return;
    }
    activeTimers[requestId]= setInterval(async()=>{
      console.log(requestId)
        //check if the request is still active or is being accpeted
        const {data, error}=await supabase.from("sos_requests").select("status,radius").eq("id",requestId).single();
        if(error || data?.status=="resolved"){
            console.log("Request is resolved or not active", error?.message);
            console.log("Stopping the broadcast");
            clearInterval(activeTimers[requestId]);
            delete activeTimers[requestId];
            return;
        }
        //increase the radius of request by 10
        const newRadius:number=data?.radius+10;
        const {error:RadiusError}=await supabase.from("sos_requests").update({radius:newRadius}).eq("id",requestId);
        if(RadiusError){
            console.log("Error in increasing the radius",RadiusError.message);
            throw RadiusError;
        }
        console.log(`Request ID: ${requestId} radius updated to ${newRadius} km`);

    },10000)
}
import { Request, Response } from "express";
import dotenv from "dotenv";
import  { predictFireSeverity, uploadToSupabase } from "../utils/helperFunctions";

dotenv.config();

// Hugging Face API details


// 🚀 Main function to process and upload files
export const processAndUploadFile = async (req: Request, res: Response) => {
  try {

    // Parse uploaded files
    const files = req.files as { image?: Express.Multer.File[] };
    const imageFile = files?.image?.[0];

    if (!imageFile) {
      res.status(400).json({ error: "No image uploaded." });
      return;
    }

    console.log("📸 Received image for fire severity classification...");

    // 🔥 Predict fire severity using Hugging Face
      await predictFireSeverity(imageFile.buffer);

    // console.log(`🔥 Predicted Severity: ${label} (Confidence: ${confidence})`);

    // if (label.toLowerCase() === "fake" || confidence < 0.6) {
    //   res.status(400).json({ error: "Fake fire detected. Upload rejected!" });
    //   return;
    // }

    // ✅ Upload image to Supabase
    const imageUrl = await uploadToSupabase(imageFile, "images");

    if (!imageUrl) {
      res.status(500).json({ error: "Image upload failed." });
      return;
    }

    res.status(200).json({
      message: "✅ File uploaded successfully",
      imageUrl,
    });

  } catch (error: any) {
    console.error("❌ An error occurred:", error.message);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Hugging Face API details
const HF_API_KEY = process.env.HF_API_KEY!;
const HF_MODEL_URL = process.env.HF_MODEL_URL!;

if (!HF_API_KEY || !HF_MODEL_URL) {
  console.error("❌ Hugging Face API Key or Model URL is missing!");
  process.exit(1); // Exit process if API details are missing
}

// 🔥 Function to predict fire severity using Hugging Face API
const predictFireSeverity = async (fileBuffer: Buffer) => {
  try {
    const response = await axios.post(HF_MODEL_URL, fileBuffer, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No predictions received from Hugging Face API");
    }

    const { label, score } = response.data[0]; // Assuming first result is most relevant

    return { severity: label, confidence: score };
  } catch (error: any) {
    console.error("🔥 Hugging Face API error:", error.response?.data || error.message);
    throw new Error("Failed to classify fire severity.");
  }
};

// 📂 Function to upload files to Supabase
const uploadToSupabase = async (file: Express.Multer.File, folder: string) => {
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

// 🚀 Main function to process and upload files
export const processAndUploadFile = async (req: Request, res: Response) => {
  try {
    const { name, mobile } = req.body;

    // Validate required fields
    if (!name || !mobile) {
      res.status(400).json({ error: "Name and mobile are required fields." });
      return;
    }

    // Parse uploaded files
    const files = req.files as { image?: Express.Multer.File[] };
    const imageFile = files?.image?.[0];

    if (!imageFile) {
      res.status(400).json({ error: "No image uploaded." });
      return;
    }

    console.log("📸 Received image for fire severity classification...");

    // 🔥 Predict fire severity using Hugging Face
    const { severity, confidence } = await predictFireSeverity(imageFile.buffer);

    console.log(`🔥 Predicted Severity: ${severity} (Confidence: ${confidence})`);

    if (severity.toLowerCase() === "fake" || confidence < 0.6) {
      res.status(400).json({ error: "Fake fire detected. Upload rejected!" });
      return;
    }

    // ✅ Upload image to Supabase
    const imageUrl = await uploadToSupabase(imageFile, "images");

    if (!imageUrl) {
      res.status(500).json({ error: "Image upload failed." });
      return;
    }

    res.status(200).json({
      message: "✅ File uploaded successfully",
      severity,
      confidence,
      imageUrl,
    });

  } catch (error: any) {
    console.error("❌ An error occurred:", error.message);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

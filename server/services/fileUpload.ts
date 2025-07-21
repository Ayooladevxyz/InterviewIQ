import multer from "multer";
import path from "path";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = {
    cv: [".pdf", ".docx", ".doc"],
    audio: [".mp3", ".wav", ".m4a", ".ogg"],
  };

  const fileExt = path.extname(file.originalname).toLowerCase();
  const fieldName = file.fieldname;

  if (fieldName === "cv" && allowedTypes.cv.includes(fileExt)) {
    cb(null, true);
  } else if (fieldName === "audio" && allowedTypes.audio.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types for ${fieldName}: ${allowedTypes[fieldName as keyof typeof allowedTypes]?.join(", ")}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function parseDocument(filePath: string, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else {
      throw new Error("Unsupported file format");
    }
  } catch (error) {
    throw new Error("Failed to parse document: " + (error as Error).message);
  }
}

export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Failed to cleanup file:", error);
  }
}

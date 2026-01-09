"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(formData: FormData) {
    const file = formData.get("file") as File;

    if (!file) {
        throw new Error("No file provided");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "storyboard_uploads" },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (result) {
                    resolve({ secure_url: result.secure_url });
                } else {
                    reject(new Error("Upload failed"));
                }
            }
        ).end(buffer);
    });
}

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "dotenv";
config({ path: "./config/config.env" });

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: "ap-south-1",
});
export const presignedUrl = async () => {
  let url = -1;

  const key = v4();
  const ObjectParams = {
    Bucket: "thousandwayshospital",
    Key: key,
  };
  const expiresIn = 3600;
  const command = new PutObjectCommand(ObjectParams);
  try {
    url = await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    url = -1;
  }

  return { key: key, url: url };
};

// not presigned but will work if bucket public

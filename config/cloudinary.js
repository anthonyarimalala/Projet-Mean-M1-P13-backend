const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME, // récupère dzpdk3bfy
  api_key: process.env.CLOUDINARY_KEY, // récupère 643291953717832
  api_secret: process.env.CLOUDINARY_SECRET, // récupère xRMj2pjs-nrsrUa0XxL6e05SO3Y
});

module.exports = cloudinary;

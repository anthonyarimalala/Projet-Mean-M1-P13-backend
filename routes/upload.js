const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

/*
|--------------------------------------------------------------------------
| UPLOAD IMAGES
|--------------------------------------------------------------------------
*/
router.post("/", upload.array("images"), async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Aucune image reçue" });
    }

    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "posts" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id
              });
            }
          }
        ).end(file.buffer);
      });
    });

    const images = await Promise.all(uploadPromises);

    res.status(200).json({ images });

  } catch (error) {
    console.error("Erreur upload:", error);
    res.status(500).json({ message: "Erreur upload Cloudinary" });
  }
});


/*
|--------------------------------------------------------------------------
| DELETE IMAGE
|--------------------------------------------------------------------------
*/
router.delete("/", async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: "public_id requis" });
    }

    await cloudinary.uploader.destroy(public_id);

    res.status(200).json({ message: "Image supprimée" });

  } catch (error) {
    console.error("Erreur suppression:", error);
    res.status(500).json({ message: "Erreur suppression Cloudinary" });
  }
});

module.exports = router;

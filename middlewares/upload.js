
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png/;
        allowed.test(path.extname(file.originalname).toLowerCase())
            ? cb(null, true) : cb(new Error("Only images allowed"));
    },
});

module.exports = upload;
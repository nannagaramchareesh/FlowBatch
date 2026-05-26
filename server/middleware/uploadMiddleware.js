import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  // We want to allow excel files
  const filetypes = /xlsx|xls|csv/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  // Mimetype checking for Excel can be tricky, so we rely mostly on extname
  const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.mimetype === 'application/vnd.ms-excel' ||
                   file.mimetype === 'text/csv' || 
                   file.mimetype === 'application/octet-stream'; // Some browsers send excel as octet-stream

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed!'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;

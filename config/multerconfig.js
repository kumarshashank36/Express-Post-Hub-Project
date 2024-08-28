const multer = require('multer');   
const path = require('path');
const crypto = require('crypto');

//diskstorage
const storage = multer.diskStorage({        // yaha file ka folder setup ho rha hai
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
        crypto.randomBytes(12, function (err, name) {     //iss line s random name create krte h file ka taaaki overwrite na ho jaye same name se
            const fn = name.toString("hex")+path.extname(file.originalname);
            cb(null, fn);
        })
    }
})
  
//export upload variable
const upload = multer({ storage: storage });

module.exports = upload;
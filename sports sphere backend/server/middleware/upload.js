const path = require('path')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if      (file.fieldname === 'profileImage') cb(null, 'server/public/profiles')
        else if (file.fieldname === 'rules')        cb(null, 'server/public/sports')
        else if (file.fieldname === 'document')     cb(null, 'server/public/documents')
        else if (file.fieldname === 'logo')         cb(null, 'server/public/teams')
        else if (file.fieldname === 'playerImg')    cb(null, 'server/public/players')
        else if (file.fieldname === 'image')        cb(null, 'server/public/venues')
        else                                        cb(null, 'server/public')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const extension = path.extname(file.originalname || '').toLowerCase()
        cb(null, file.fieldname + '-' + uniqueSuffix + extension)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (allowedTypes.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPG PNG and PDF allowed'), false)
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})

module.exports = upload
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const folderMap = {
    profileImage: 'sportssphere/profiles',
    rules:        'sportssphere/sports',
    document:     'sportssphere/documents',
    logo:         'sportssphere/teams',
    playerImg:    'sportssphere/players',
    image:        'sportssphere/venues',
}

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        const folder = folderMap[file.fieldname] || 'sportssphere/misc'
        const isPdf  = file.mimetype === 'application/pdf'

        return {
            folder,
            resource_type: isPdf ? 'raw' : 'image',
            public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
            allowed_formats: isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png'],
        }
    },
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
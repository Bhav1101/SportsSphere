const fs = require('fs')
const path = require('path')
const venueModel = require('./venueModel')

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public')

const resolveStoredImagePath = (imagePath) => {
    const normalized = String(imagePath || '').replace(/\\/g, '/').replace(/^\/+/, '')
    if (!normalized) return ''

    // Preferred path as stored in DB
    if (fs.existsSync(path.join(PUBLIC_DIR, normalized))) return normalized

    // Backward compatibility: old uploads were stored in server/public root
    if (normalized.startsWith('venues/')) {
        const fallback = normalized.replace(/^venues\//, '')
        if (fs.existsSync(path.join(PUBLIC_DIR, fallback))) return fallback
    }

    return normalized
}

const buildVenueImageUrl = (req, imagePath) => {
    if (!imagePath) return ""

    if (/^https?:\/\//i.test(imagePath)) return imagePath

    const resolvedPath = resolveStoredImagePath(imagePath)
    return `${req.protocol}://${req.get('host')}/${resolvedPath}`
}

// ADD VENUE — admin only
const addVenue = async (req, res) => {
    try {
        const incomingData = req.body || {}
        let validation     = ""

        if (!incomingData.venueName) validation += 'venueName is required | '
        if (!incomingData.city)      validation += 'city is required | '

        if (!!validation) return res.json({
            status: 400, success: false, message: validation
        })

        let existing = await venueModel.findOne({
            venueName: { $regex: new RegExp('^' + incomingData.venueName + '$', 'i') },
            isDelete:  false
        })

        if (!!existing) return res.json({
            status: 400, success: false, message: "Venue already exists"
        })

        let newVenue = new venueModel({
            venueName:     incomingData.venueName,
            city:          incomingData.city,
            state:         incomingData.state         || "",
            address:       incomingData.address       || "",
            totalCapacity: Number(incomingData.totalCapacity) || 0,
            image:         req.file ? req.file.path : "",
            sportIds:      incomingData.sportIds ? incomingData.sportIds.split(',') : [],
            createdBy:     req.decoded._id
        })

        let savedVenue = await newVenue.save()

        res.json({
            status:  201,
            success: true,
            message: "Venue added successfully",
            data:    {
                ...savedVenue.toObject(),
                imageUrl: buildVenueImageUrl(req, savedVenue.image)
            }
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// FETCH ALL VENUES
const fetchAllVenues = async (req, res) => {
    try {
        let venues = await venueModel
            .find({ isDelete: false })
            .populate('sportIds', 'sportName')

        let total = await venueModel.countDocuments({ isDelete: false })

        res.json({
            status: 200,
            success: true,
            message: "Venues fetched",
            total,
            data: venues.map(venue => ({
                ...venue.toObject(),
                imageUrl: buildVenueImageUrl(req, venue.image)
            }))
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// FETCH SINGLE VENUE
const fetchSingleVenue = async (req, res) => {
    try {
        const incomingData = req.body || {}
        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let venue = await venueModel
            .findOne({ _id: incomingData._id, isDelete: false })
            .populate('sportIds', 'sportName')

        if (!venue) return res.json({ status: 404, success: false, message: "Venue not found" })

        res.json({
            status: 200,
            success: true,
            message: "Venue fetched",
            data: {
                ...venue.toObject(),
                imageUrl: buildVenueImageUrl(req, venue.image)
            }
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// UPDATE VENUE
const updateVenue = async (req, res) => {
    try {
        const incomingData = req.body || {}
        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let venue = await venueModel.findOne({ _id: incomingData._id, isDelete: false })
        if (!venue) return res.json({ status: 404, success: false, message: "Venue not found" })

        if (incomingData.venueName)     venue.venueName     = incomingData.venueName
        if (incomingData.city)          venue.city          = incomingData.city
        if (incomingData.state)         venue.state         = incomingData.state
        if (incomingData.address)       venue.address       = incomingData.address
        if (incomingData.totalCapacity) venue.totalCapacity = Number(incomingData.totalCapacity)
        if (req.file)                   venue.image         = req.file.path

        venue.updatedBy = req.decoded._id
        venue.updatedAt = Date.now()
        let savedVenue  = await venue.save()

        res.json({
            status: 200,
            success: true,
            message: "Venue updated",
            data: {
                ...savedVenue.toObject(),
                imageUrl: buildVenueImageUrl(req, savedVenue.image)
            }
        })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

// SOFT DELETE VENUE
const softDeleteVenue = async (req, res) => {
    try {
        const incomingData = req.body || {}
        if (!incomingData._id) return res.json({ status: 400, success: false, message: "_id is required" })

        let venue = await venueModel.findOne({ _id: incomingData._id, isDelete: false })
        if (!venue) return res.json({ status: 404, success: false, message: "Venue not found" })

        venue.isDelete  = true
        venue.updatedBy = req.decoded._id
        venue.updatedAt = Date.now()
        await venue.save()

        res.json({ status: 200, success: true, message: "Venue deleted" })

    } catch (err) {
        res.json({ status: 500, success: false, message: "ISE: " + err.message })
    }
}

module.exports = { addVenue, fetchAllVenues, fetchSingleVenue, updateVenue, softDeleteVenue }
/**
 * Migration: Fix assignedLocation on all existing employees.
 *
 * The old schema stored raw coordinates (latitude, longitude, radiusMeters)
 * directly in the employee document. The new schema stores only the office
 * key ("HYDERABAD" or "VIZAG") — coordinates are resolved at runtime from
 * constants/offices.js.
 *
 * Run once:
 *   node scripts/migrateAssignedLocation.js
 */

import mongoose from "mongoose"
import dotenv   from "dotenv"
import Employee from "../models/Employee.js"
import { OFFICE_LOCATIONS } from "../constants/offices.js"

dotenv.config()

const COORD_TO_OFFICE_KEY = Object.fromEntries(
    Object.entries(OFFICE_LOCATIONS).map(([key, loc]) => [
        `${loc.latitude},${loc.longitude}`,
        key,
    ])
)

/**
 * Guess the office key from stored coordinates by finding the closest office.
 * If the nearest office is more than 5km away, returns null (unrecognised location).
 */
const toRad  = (deg) => (deg * Math.PI) / 180
const distKm = (lat1, lon1, lat2, lon2) => {
    const R    = 6371
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a    =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const guessOfficeKey = (lat, lng) => {
    let best = null, bestDist = Infinity
    for (const [key, loc] of Object.entries(OFFICE_LOCATIONS)) {
        const d = distKm(lat, lng, loc.latitude, loc.longitude)
        if (d < bestDist) { bestDist = d; best = key }
    }
    return bestDist <= 5 ? best : null  // 5 km tolerance
}

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    console.log("Connected to MongoDB")

    const employees = await Employee.find({})
    let updated = 0, skipped = 0, cleared = 0

    for (const emp of employees) {
        const loc = emp.assignedLocation

        // Already in new format
        if (loc?.office && !loc.latitude) {
            skipped++
            continue
        }

        // Has old-style raw coordinates — try to map to an office key
        if (loc?.latitude && loc?.longitude) {
            const key = guessOfficeKey(loc.latitude, loc.longitude)
            if (key) {
                emp.assignedLocation = { office: key, label: OFFICE_LOCATIONS[key].label }
                await emp.save({ validateBeforeSave: false })
                console.log(`  ✅ ${emp.firstName} ${emp.lastName} → ${key}`)
                updated++
            } else {
                emp.assignedLocation = { office: null, label: "" }
                await emp.save({ validateBeforeSave: false })
                console.warn(`  ⚠️  ${emp.firstName} ${emp.lastName} — coordinates (${loc.latitude}, ${loc.longitude}) don't match any office. Cleared.`)
                cleared++
            }
            continue
        }

        // No location at all — leave as null
        skipped++
    }

    console.log(`\nDone. Updated: ${updated}, Cleared: ${cleared}, Skipped: ${skipped}`)
    await mongoose.disconnect()
}

run().catch((err) => {
    console.error(err)
    process.exit(1)
})
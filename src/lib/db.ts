import mongoose from 'mongoose'

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  )
}

async function connectToDatabase() {
  let mongoConnection
  if (MONGODB_URI) {
    if (!mongoose.connection.readyState) {
      mongoConnection = mongoose.connect(MONGODB_URI).then((mongoose) => {
        console.log('Connected to MongoDB')
        return mongoose
      })
    }
  }

  return mongoConnection
}

export default connectToDatabase

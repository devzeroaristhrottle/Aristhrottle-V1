import { useState, useEffect } from 'react'

const useCountdown = () => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const nextReset = new Date()
      nextReset.setUTCHours(24, 0, 0, 0) // Set to next UTC midnight

      const timeDifference = nextReset.getTime() - now.getTime()
      if (timeDifference <= 0) {
        setTimeLeft('00 : 00 : 00')
        return
      }

      const hours = Math.floor(timeDifference / (1000 * 60 * 60))
        .toString()
        .padStart(2, '0')
      const minutes = Math.floor(
        (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
      )
        .toString()
        .padStart(2, '0')
      const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, '0')

      setTimeLeft(`${hours} : ${minutes} : ${seconds}`)
    }

    // Update every second
    const timer = setInterval(updateTimer, 1000)
    updateTimer() // Run initially

    return () => clearInterval(timer) // Cleanup on unmount
  }, [])

  return timeLeft
}

export default useCountdown

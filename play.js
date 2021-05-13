export default class Play {
  constructor (delegate, buffer) {
    this.delegate = delegate
    this.source = this.audioContext.createBufferSource()
    this.source.buffer = buffer
    this.started = false
  }

  get audioContext () {
    return this.delegate.audioContext
  }

  start ({ when, offset = 0, duration, playbackRate = 1, loopStart, loopEnd }) {
    if (this.started) return

    duration = this.source.buffer.duration - offset

    if (loopStart || loopEnd) {
      this.source.loopStart = loopStart
      this.source.loopEnd = loopEnd
      this.source.loop = true
      duration = loopEnd - loopStart
    }

    this.source.playbackRate.value = Math.abs(parseFloat(playbackRate))
    this.source.start(when, offset, (loopStart || loopEnd) ? undefined : duration)
    this.started = true
    this.trackProgress(duration, playbackRate)
    this.delegate.playStarted()
  }

  trackProgress (duration, playbackRate) {
    const self = this
    const adjustedDuration = duration / Math.abs(playbackRate)
    let start = this.audioContext.currentTime
    let end = start + adjustedDuration

    this.timerId = requestAnimationFrame(function loop () {
      if (self.audioContext.currentTime >= end) {
        start = start + adjustedDuration
        end = end + adjustedDuration
      }
      const progress = (self.audioContext.currentTime - start) / adjustedDuration
      self.delegate.playProgressed(progress)
      self.timerId = requestAnimationFrame(loop)
    })
  }

  stop () {
    if (this.started) {
      cancelAnimationFrame(this.timerId)
      this.source.stop()
      this.started = false
      this.delegate.playStopped()
    }
  }
}
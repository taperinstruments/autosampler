export default class AudioCron {
  constructor (audioContext) {
    this.audioContext = audioContext
  }
  
  start (ms, callback) {
    const self = this
    let target = this.audioContext.currentTime + (ms / 1000)
    
    this.id = requestAnimationFrame(function loop () {
      if (self.audioContext.currentTime >= target) {
        callback()
        target = target + (ms / 1000)
      }
      self.id = requestAnimationFrame(loop)
    })
  }
  
  stop () {
    cancelAnimationFrame(this.id)
  }
}

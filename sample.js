import Recording from './recording.js'
import Play from './play.js'

export default class Sample extends EventTarget {
  constructor ({ id, audioContext, duration }) {
    super()
    this.id = id
    this.audioContext = audioContext
    this.duration = duration
    this.recordingResolve = function () {}
  }

  get recordingDuration () {
    return (this.duration + Sample.PRE_ROLL_DURATION  + Sample.POST_ROLL_DURATION) * 1000
  }

  get playbackRate () {
    return this._playbackRate || (this._playbackRate = randomPlaybackRate())
  }

  get isReversed () {
    return this.playbackRate < 0
  }

  get pan () {
    return this._pan || (this._pan = randomPan())
  }

  get empty () {
    return !this.buffer
  }

  get panNode () {
    if (this._panNode) return this._panNode
    const panNode = this.audioContext.createStereoPanner()
    panNode.pan.value = this.pan
    return this._panNode = panNode
  }

  get audioBuffer () {
    if (this._audioBuffer) return this._audioBuffer

    return this._audioBuffer = new Promise((resolve) => {
      this.audioContext.decodeAudioData(this.buffer, resolve)
    })
  }

  record (stream) {
    this.recording = new Recording(this, stream)
    this.recording.start()

    this.recordingTimer = setTimeout(() => this.recording.stop(), this.recordingDuration)
    this.preRollTimer = setTimeout(() => this.dispatch('recording:start'), Sample.PRE_ROLL_DURATION * 1000)

    return new Promise((resolve) => this.recordingResolve = resolve)
  }

  abortRecording () {
    if (this.recording){
      clearTimeout(this.recordingTimer)
      clearTimeout(this.preRollTimer)
      this.recording.abort()
    }
  }

  recordingStarted () {
    this.dispatch('recording:pre-roll')
  }

  recordingStopped () {
    this.dispatch('recording:stop')
    this.recording = null
  }

  async recordingCompleted (blob) {
    await this.setBlob(blob)
    this.recordingResolve(true)
    this.dispatch('recording:complete')
  }

  recordingAborted (blob) {
    this.recordingResolve(false)
  }

  async setBlob (value) {
    this._blob = value
    if (this._blob) {
      await this.setBuffer(await this._blob.arrayBuffer())
    }
  }

  async setBuffer (arrayBuffer) {
    this.buffer = await this.audioContext.decodeAudioData(arrayBuffer)
    if (this.playbackRate < 0) {
      for (let i = 0; i < this.buffer.numberOfChannels; i++) {
        Array.prototype.reverse.call(this.buffer.getChannelData(i))
      }
    }
  }

  play () {
    this.stop()
    this._play = new Play(this, this.buffer)

    this._play.source.connect(this.panNode)
    this.panNode.connect(this.audioContext.destination)

    const offset = this.isReversed ? Sample.POST_ROLL_DURATION : Sample.PRE_ROLL_DURATION

    this._play.start({
      offset,
      playbackRate: this.playbackRate,
      loopStart: offset,
      loopEnd: offset + this.duration
    })
  }

  playStarted () {
    this.dispatch('play')
  }

  playProgressed (progress) {
    this.dispatch('playprogress', { detail: { progress } })
  }

  playStopped (progress) {
    this.dispatch('stop')
    this._play = null
  }

  stop () {
    if (this._play) this._play.stop()
  }

  async clear () {
    this.stop()
    this.abortRecording()
    this.blob = null
    this.buffer = null
    this.dispatch('clear')
  }

  dispatch (eventName, { detail = {}, bubbles = false, cancelable = false } = {}) {
    const event = new CustomEvent(eventName, { detail, bubbles, cancelable })
    this.dispatchEvent(event)
    return event
  }
}

function randomPlaybackRate () {
  const speeds = [-2.0, -1.5, -1.0, -0.5, 0.5, 1.0, 1.5, 2.0]
  return speeds[Math.floor(Math.random() * speeds.length)]
}

function randomPan () {
  return Math.random() * [1, -1][Math.floor(Math.random() * 2)]
}

Sample.PRE_ROLL_DURATION = 1
Sample.POST_ROLL_DURATION = 0.1

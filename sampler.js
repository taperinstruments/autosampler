import AudioCron from './audio-cron.js'
import Sample from './sample.js'

const SAMPLES_COUNT = 12

export default class Sampler {
  constructor () {
    this.samples = createSamples({ audioContext: this.audioContext, duration: 5 })
  }

  get cron () {
    return this._cron || (this._cron = new AudioCron(this.audioContext))
  }

  get audioContext () {
    return this._audioContext || (this._audioContext = new (window.AudioContext || window.webkitAudioContext))
  }

  get stream () {
    if (this._stream) return this._stream
    return this._stream = new Promise((resolve) => {
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } }).then(resolve)
    })
  }

  setDuration (d) {
    this.samples.forEach(sample => sample.duration = parseFloat(d))
  }

  async startSampling () {
    this.audioContext.resume()
    this.cron.start(2000, async () => this.sample())
    this.sample()
  }

  stopSampling () {
    this.cron.stop()
  }

  startLooping () {
    this.activeSamples
      .filter(sample => !sample.empty)
      .forEach(sample => sample.play())
    this.loop = true
  }

  stopLooping () {
    this.samples.forEach(sample => sample.stop())
    this.loop = false
  }

  get activeSamples () {
    return this.samples.filter((sample, i) => i < this.activeCount)
  }

  async sample () {
    const availableSamples = this.activeSamples.filter(sample => !sample.recording)
    const emptyAvailable = availableSamples.filter(sample => sample.empty)
    const samples = emptyAvailable.length ? emptyAvailable : availableSamples
    const index = Math.floor(Math.random() * samples.length)
    const randomSample = samples[index]
    if (!randomSample) return

    try {
      if (await randomSample.record(await this.stream) && this.loop) {
        randomSample.play()
      }
    } catch (error) {
      alert(error.message)
    }
  }
}

function createSamples ({ audioContext, duration }) {
  return Array(SAMPLES_COUNT).fill(null).map((e, id) => new Sample({
    id,
    audioContext,
    duration
  }))
}
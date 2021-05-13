import Sample from './sample.js'

export default class SampleController {
  constructor ({ sample, element }) {
    this.sample = sample
    this.element = element
    this.progress = element.querySelector('progress')

    this.canvas = element.querySelector('canvas')
    this.canvasContext = this.canvas.getContext('2d')
    this.lineWidth = 2
    this.lineSpacing = 1
    this.setCanvasDimensions()

    this.sample.addEventListener('recording:pre-roll', () => {
      this.element.classList.add('sample--pre-roll')
    })
    this.sample.addEventListener('recording:start', () => {
      this.element.classList.remove(...this.classes)
      this.element.classList.add('sample--recording')
    })
    this.sample.addEventListener('recording:stop', () => {
      this.element.classList.remove('sample--recording')
      this.element.classList.remove('sample--pre-roll')
    })
    this.sample.addEventListener('recording:complete', () => {
      this.plotWaveform()
    })

    this.sample.addEventListener('play', () => {
      this.element.classList.remove(...this.classes)
      this.element.classList.add('sample--playing')
    })
    this.sample.addEventListener('stop', () => {
      this.element.classList.remove(...this.classes)
    })
    this.sample.addEventListener('clear', (e) => {
      this.clearCanvas()
    })
    this.sample.addEventListener('playprogress', (e) => {
      this.progress.style.opacity = 1
      this.progress.value = e.detail.progress
    })

    addEventListener('resize', debounce(async () => {
      await this.setCanvasDimensions()
      this.plotWaveform()
    }, 100))
  }

  plotWaveform () {
    this.clearCanvas()

    this.waveformData.forEach((d, i) => {
      drawLine({
        context: this.canvasContext,
        x1: (i * (this.lineWidth + this.lineSpacing)),
        y1: Math.floor(-((d * this.canvas.height) / 2)),
        x2: (i * (this.lineWidth + this.lineSpacing)),
        y2: Math.floor((d * this.canvas.height) / 2),
        width: this.lineWidth,
        color: '#000'
      })
    })
  }

  get classes () {
    return ['sample--pre-roll', 'sample--recording', 'sample--playing']
  }

  get waveformData () {
    if (!this.sample.buffer) return []
    const raw = this.sample.buffer.getChannelData(0)
    const sampleCount = Math.floor(this.sample.duration * this.sample.buffer.sampleRate)
    const start = this.sample.isReversed ?
      Math.floor(Sample.POST_ROLL_DURATION * this.sample.buffer.sampleRate) :
      Math.floor(Sample.PRE_ROLL_DURATION * this.sample.buffer.sampleRate)

    const reduced = reduce(
      raw.slice(start, start + sampleCount),
      Math.ceil(this.canvas.width / (this.lineWidth + this.lineSpacing))
    )

    return Math.max(...reduced) > (1 / this.canvas.height) ? normalize(reduced) : reduced
  }

  clearCanvas () {
    this.canvasContext.clearRect(-1, -this.canvas.height / 2, this.canvas.width + 1, this.canvas.height + 1)
  }

  setCanvasDimensions () {
    return new Promise((resolve) => {
      this.canvas.style.display = 'none'

      requestAnimationFrame(() => {
        this.canvas.width = Math.floor(innerDimensions(this.canvas.parentNode).width)
        this.canvas.height = Math.floor(innerDimensions(this.canvas.parentNode).height)
        if (this.canvas.height % 2 !== 0) this.canvas.height--
        this.canvasContext.translate(this.lineWidth / 2, (this.canvas.height / 2))
        this.canvas.style.display = ''
        resolve()
      })
    })
  }
}

// Reduces the audio data to the number of samples specified by `count` using the average of each block
function reduce (samples, count) {
  const blockSize = Math.floor(samples.length / count)
  const reduced = []

  for (let i = 0; i < count; i++) {
    let blockStart = blockSize * i
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(samples[blockStart + j])
    }
    reduced.push(sum / blockSize)
  }
  return reduced
}

function normalize (samples) {
  const multiplier = Math.pow(Math.max(...samples), -1)
  return samples.map(n => n * multiplier)
}

function drawLine ({context, x1, y1, x2, y2, width, color, lineCap = 'butt'}) {
  context.lineWidth = width
  context.strokeStyle = color
  context.beginPath()
  context.lineCap = lineCap
  context.moveTo(x1, y1)
  context.lineTo(x2, y2)
  context.stroke()
}

function innerDimensions (element) {
  const computedStyle = getComputedStyle(element)
  let height = element.clientHeight
  let width = element.clientWidth
  height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom)
  width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight)
  return { width, height }
}

function debounce(fn, delay = 10) {
  let timeoutId = null

  return (...args) => {
    const callback = () => fn.apply(this, args)
    clearTimeout(timeoutId)
    timeoutId = setTimeout(callback, delay)
  }
}



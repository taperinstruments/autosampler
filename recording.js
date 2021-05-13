export default class Recording {
  constructor (delegate, stream) {
    this.delegate = delegate
    this.recorder = new MediaRecorder(stream)
    this.chunks = []
    this.recorder.addEventListener('start', () => this.delegate.recordingStarted())
    this.recorder.addEventListener('dataavailable', (e) => this.chunk(e.data))
    this.recorder.addEventListener('stop', () => {
      this.delegate.recordingStopped()
      this.blobify()
    })
  }

  start (timeslice) {
    this.recorder.start(timeslice)
  }

  chunk (data) {
    this.chunks.push(data)
  }

  blobify () {
    if (!this.aborted) {
      this.delegate.recordingCompleted(new Blob(this.chunks))
    }
  }

  stop () {
    this.recorder.stop()
  }

  abort () {
    this.aborted = true
    this.stop()
    this.delegate.recordingAborted()
  }
}

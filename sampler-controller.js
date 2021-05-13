import Sampler from './sampler.js'
import SampleController from './sample-controller.js'

export default class SamplerController {
  constructor () {
    this.sampler = new Sampler()
    this.samples = this.sampler.samples
    this.render()
    
    this.samplingTarget = document.getElementById('sampling')
    this.loopTarget = document.getElementById('loop')
    this.clearTarget = document.getElementById('clear')
    this.durationTarget = document.getElementById('duration')
    this.activeTarget = document.getElementById('active')
  
    this.sampler.activeCount = parseInt(this.activeTarget.value)
    this.sampler.loop = this.loopTarget.checked
    
    this.samplingTarget.onchange = async () => {
      await this.sampler.stream
      this.samplingTarget.checked ? this.sampler.startSampling() : this.sampler.stopSampling()
    }
    
    this.loopTarget.onchange = () => {
      this.loopTarget.checked ? this.sampler.startLooping() : this.sampler.stopLooping()
    }
    
    this.clearTarget.onclick = () => this.samples.forEach(sample => sample.clear())
    
    this.durationTarget.onchange = () => {
      this.sampler.setDuration(this.durationTarget.value)
    }
    
    this.activeTarget.onchange = () => {
      const before = this.sampler.activeCount
      this.sampler.activeCount = parseInt(this.activeTarget.value)
      if (this.sampler.activeCount > before) {
        for (let i = before; i < this.sampler.activeCount; i++) {
          if (!this.samples[i].empty) this.samples[i].play({ loop: true })
        } 
      } else {
        for (let i = this.sampler.activeCount; i < before; i++) {
          this.samples[i].stop()
          this.samples[i].abortRecording()
        } 
      }
    }
  }
  
  render () {
    const container = document.getElementById('samples')
    this.sampleTargets = this.samples.map((sample) => {
      const element = sampleElement(sample)
      container.append(element)
      element.controller = new SampleController({ sample, element })
      return element
    })
  }
}

function sampleElement (sample) {
  const template = `<li class="sample" id="sample_${sample.id}">
  <dl class="sample__meta">
    <dt title="Playback speed"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg></dt>
    <dd>${sample.playbackRate.toFixed(1)}</dd>
    <dt title="Pan"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
</svg></dt>
    <dd><abbr aria-label="${sample.pan < 0 ? 'Left' : 'Right'}" title="${sample.pan < 0 ? 'Left' : 'Right'}">${sample.pan < 0 ? 'L' : 'R'}</abbr> ${Math.abs(sample.pan).toFixed(1)}</dd>
  </dl>
  <div class="sample__waveform">
    <canvas width="0" height="0"></canvas>
    <progress max="1" value="0"></progress>
  </div>
</li>`
  const placeholder = document.createElement('div')
  placeholder.innerHTML = template
  return placeholder.firstElementChild
}

# [autosampler](https://taperinstruments.github.io/autosampler/)

A port of [Yann Seznec](https://github.com/yannseznec)'s [auto_sampler](https://github.com/yannseznec/auto_sampler) for the Web.

Once SAMPLING is switched on, every two seconds, audio is sampled into a random sample bank, then looped. Each sample bank is randomly assigned a playback speed (0.5, 1, 1.5, and 2), and play direction (forwards or backwards). DURATION controls the length of each sample in seconds. ACTIVE controls the number of sample banks that will be sampled and looped.

![Screenshot of the autosampler software, displaying 12 audio waveforms](https://taperinstruments.github.io/autosampler/screenshot.png)

## Browser Support
Tested in Firefox & Chrome (macOS). Should work in modern browsers that support the MediaRecorder API.

Some Safari versions have experimental MediaRecorder support.
To enable on macOS: in Preferences - Advanced - check Show Develop Menu. Then from the Develop menu choose: Experimental Features - MediaRecorder
On iOS, enable MediaRecorder: in Settings - Safari - Advanced - Experimental Features - MediaRecorder
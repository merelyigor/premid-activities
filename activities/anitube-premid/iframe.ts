const iframe = new iFrame();

iframe.on('UpdateData', () => {
  const video = [...document.querySelectorAll('video')]
    .find(video => Number.isFinite(video.duration) && video.duration > 0);

  if (!video) {
    return;
  }

  iframe.send({
    currentTime: video.currentTime,
    currTime: video.currentTime,
    duration: video.duration,
    paused: video.paused,
  });
});

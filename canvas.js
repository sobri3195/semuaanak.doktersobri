function renderOnCanvas(canvas, analysis) {
  if (!canvas || !analysis) {
    return;
  }
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f172a";
  ctx.font = "18px Arial";
  ctx.fillText(analysis.title, 24, 40);
  ctx.font = "14px Arial";
  var lines = analysis.canvasLines || [];
  for (var i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 24, 80 + i * 28);
  }
}

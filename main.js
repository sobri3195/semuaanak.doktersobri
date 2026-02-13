var growthData;
var lmsData;
var isDataReady = false;

function loadGrowthData() {
  return $.getJSON("data_extended.json", function(d) {
    growthData = d;
    lmsData = d.lms;
    isDataReady = true;
  });
}

function getUmur() {
  return parseInt($("#age").val(), 10);
}

function getLength() {
  return parseFloat($("#tb").val());
}

function getWeight() {
  return parseFloat($("#bb").val());
}

function getGender() {
  return $("#gender").val();
}

function computeZScore(lms, value) {
  if (!lms || lms.length !== 3 || !isFinite(value) || value <= 0) {
    return NaN;
  }
  var L = lms[0];
  var M = lms[1];
  var S = lms[2];
  if (!isFinite(L) || !isFinite(M) || !isFinite(S) || M <= 0 || S <= 0) {
    return NaN;
  }
  if (Math.abs(L) < 1e-9) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

function erf(x) {
  var sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  var a1 = 0.254829592;
  var a2 = -0.284496736;
  var a3 = 1.421413741;
  var a4 = -1.453152027;
  var a5 = 1.061405429;
  var p = 0.3275911;
  var t = 1 / (1 + p * x);
  var y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
  return sign * y;
}

function zToPercentile(z) {
  if (!isFinite(z)) {
    return NaN;
  }
  return 0.5 * (1 + erf(z / Math.sqrt(2))) * 100;
}

function getMedianValue(metricData, age, fallback) {
  if (!metricData || metricData.length <= age) {
    return fallback;
  }
  var entry = metricData[age];
  if (!entry || entry.length < 4) {
    return fallback;
  }
  return entry[3];
}

function classifyHeight(z) {
  if (!isFinite(z)) return "Data tidak tersedia";
  if (z < -3) return "Sangat pendek (severe stunting)";
  if (z < -2) return "Pendek (stunting)";
  if (z <= 2) return "Normal";
  if (z <= 3) return "Tinggi";
  return "Sangat tinggi";
}

function classifyWeight(z) {
  if (!isFinite(z)) return "Data tidak tersedia";
  if (z < -3) return "Sangat kurus (severely underweight)";
  if (z < -2) return "Kurus (underweight)";
  if (z <= 2) return "Normal";
  if (z <= 3) return "Berat badan di atas normal";
  return "Berat badan sangat tinggi";
}

function classifyBMI(z) {
  if (!isFinite(z)) return "Data tidak tersedia";
  if (z < -3) return "Sangat kurus (severe thinness)";
  if (z < -2) return "Kurus (thinness)";
  if (z <= 1) return "Normal";
  if (z <= 2) return "Risiko overweight";
  if (z <= 3) return "Overweight";
  return "Obesitas";
}

function classifyWFL(index) {
  var mapping = [
    "Sangat kurus",
    "Kurus",
    "Normal",
    "Normal",
    "Normal",
    "Risiko overweight",
    "Overweight",
    "Obesitas"
  ];
  if (index < 0 || index >= mapping.length) {
    return "Di luar grafik";
  }
  return mapping[index];
}

function analyzeLinearMetric(metric, gender, age, value, title, options) {
  options = options || {};
  var metricData = growthData[gender][metric];
  var lms = (lmsData && lmsData[gender] && lmsData[gender][metric]) ? lmsData[gender][metric][age] : null;
  var z = computeZScore(lms, value);
  var percentile = zToPercentile(z);
  var median = lms ? lms[1] : getMedianValue(metricData, age, null);
  if (isFinite(median) && metricData && metricData.length > age && metricData[age] && metricData[age][3]) {
    median = metricData[age][3];
  }
  var diff = (isFinite(value) && isFinite(median)) ? value - median : null;
  var formatter = options.formatter || function(v) { return isFinite(v) ? v.toFixed(options.decimals || 1) : "-"; };
  var measurementLabel = options.valueLabel || (metric === "bfa" ? "BMI" : metric === "wfa" ? "Berat" : "Tinggi");
  var classification;
  if (metric === "lfa") classification = classifyHeight(z);
  else if (metric === "wfa") classification = classifyWeight(z);
  else classification = classifyBMI(z);

  var percentileText = isFinite(percentile) ? percentile.toFixed(1) + "%" : "-";
  var diffText = diff !== null ? (diff >= 0 ? "+" : "") + formatter(diff) + (options.units || (metric === "bfa" ? " kg/m²" : metric === "wfa" ? " kg" : " cm")) : "-";
  var medianText = formatter(median) + (options.units || (metric === "bfa" ? " kg/m²" : metric === "wfa" ? " kg" : " cm"));
  var measurementText = formatter(value) + (options.units || (metric === "bfa" ? " kg/m²" : metric === "wfa" ? " kg" : " cm"));

  return {
    title: title,
    metric: metric,
    measurementLabel: measurementLabel,
    measurement: measurementText,
    median: medianText,
    diff: diffText,
    z: isFinite(z) ? z.toFixed(2) : "-",
    percentile: percentileText,
    classification: classification,
    canvasLines: [
      measurementLabel + ": " + measurementText,
      "Median (z=0): " + medianText,
      "Selisih vs median: " + diffText,
      "Z-score: " + (isFinite(z) ? z.toFixed(2) : "-") + " (Persentil " + percentileText + ")",
      "Status: " + classification
    ]
  };
}

function analyzeWFL(gender, length, weight) {
  var dataset = growthData[gender]["wfl"];
  var index = Math.round((length - 40) * 2);
  var arr = dataset[index];
  var statusIdx = 0;
  if (arr) {
    while (statusIdx < arr.length && weight >= arr[statusIdx]) {
      statusIdx++;
    }
  } else {
    statusIdx = -1;
  }
  var classification = classifyWFL(statusIdx);
  var median = arr ? arr[3] : null;
  var diff = median !== null ? weight - median : null;
  var diffText = diff !== null ? (diff >= 0 ? "+" : "") + diff.toFixed(1) + " kg" : "-";
  var medianText = median !== null ? median.toFixed(1) + " kg" : "-";
  return {
    title: "Berat terhadap panjang badan",
    metric: "wfl",
    measurementLabel: "Berat",
    measurement: weight.toFixed(1) + " kg",
    median: medianText,
    diff: diffText,
    z: "-",
    percentile: "-",
    classification: classification,
    canvasLines: [
      "Berat: " + weight.toFixed(1) + " kg",
      "Median pada panjang ini: " + medianText,
      "Selisih: " + diffText,
      "Status: " + classification
    ]
  };
}

function renderAnalysisHtml(result) {
  var html = "<h3>" + result.title + "</h3>";
  html += "<ul>";
  html += "<li>" + result.measurementLabel + ": " + result.measurement + "</li>";
  html += "<li>Median (z=0): " + result.median + "</li>";
  if (result.z !== "-") {
    html += "<li>Z-score: " + result.z + " (Persentil " + result.percentile + ")</li>";
  }
  html += "<li>Selisih terhadap median: " + result.diff + "</li>";
  html += "<li>Status: " + result.classification + "</li>";
  html += "</ul>";
  return html;
}

function interpret() {
  if (!isDataReady) {
    alert("Data referensi belum siap. Silakan coba lagi.");
    return;
  }
  var age = getUmur();
  var length = getLength();
  var weight = getWeight();
  var gender = getGender();

  if (!isFinite(age) || age < 0 || age > 120) {
    alert("Umur harus antara 0-120 bulan.");
    return;
  }
  if (!isFinite(length) || length <= 0) {
    alert("Masukkan tinggi badan yang valid.");
    return;
  }
  if (!isFinite(weight) || weight <= 0) {
    alert("Masukkan berat badan yang valid.");
    return;
  }

  var analyses = [];
  analyses.push(analyzeLinearMetric("lfa", gender, age, length, "Tinggi badan menurut umur"));
  analyses.push(analyzeLinearMetric("wfa", gender, age, weight, "Berat badan menurut umur", { units: " kg" }));

  if (age <= 24) {
    analyses.push(analyzeWFL(gender, length, weight));
  } else {
    var heightMeters = length / 100;
    var bmi = weight / (heightMeters * heightMeters);
    analyses.push(analyzeLinearMetric("bfa", gender, age, bmi, "Indeks massa tubuh (BMI) menurut umur", { units: " kg/m²", valueLabel: "BMI", decimals: 2 }));
  }

  var html = analyses.map(renderAnalysisHtml).join("<hr/>");
  $("#hasil").html(html);

  renderOnCanvas(document.getElementById("img1"), analyses[0]);
  renderOnCanvas(document.getElementById("img2"), analyses[1]);
  renderOnCanvas(document.getElementById("img3"), analyses[2]);
}

$(document).ready(function() {
  $("#but").prop("disabled", true);
  loadGrowthData().always(function() {
    $("#but").prop("disabled", false);
  });

  for (var i = 0; i <= 120; ++i) {
    var years = (i / 12).toFixed(1);
    var label = i + " bulan";
    if (i % 12 === 0) {
      label += " (" + (i / 12) + " th)";
    }
    $("#age").append($("<option>").attr("value", i).text(label));
  }

  $("#but").click(function() {
    interpret();
  });
});

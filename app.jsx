const { useEffect, useMemo, useRef, useState } = React;

function getNested(source, path, fallback) {
  let current = source;
  for (let i = 0; i < path.length; i += 1) {
    if (current === null || typeof current === "undefined") {
      return fallback;
    }
    current = current[path[i]];
    if (typeof current === "undefined") {
      return fallback;
    }
  }
  return current;
}

function computeZScore(lms, value) {
  if (!lms || lms.length !== 3 || !Number.isFinite(value) || value <= 0) {
    return NaN;
  }
  const [L, M, S] = lms.map(Number);
  if (!Number.isFinite(L) || !Number.isFinite(M) || !Number.isFinite(S) || M <= 0 || S <= 0) {
    return NaN;
  }
  if (Math.abs(L) < 1e-9) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return sign * y;
}

function zToPercentile(z) {
  if (!Number.isFinite(z)) {
    return NaN;
  }
  return 0.5 * (1 + erf(z / Math.sqrt(2))) * 100;
}

function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(decimals);
}

function classifyHeight(z) {
  if (!Number.isFinite(z)) return "Data tidak tersedia";
  if (z < -3) return "Sangat pendek (severe stunting)";
  if (z < -2) return "Pendek (stunting)";
  if (z <= 2) return "Normal";
  if (z <= 3) return "Tinggi";
  return "Sangat tinggi";
}

function classifyWeight(z) {
  if (!Number.isFinite(z)) return "Data tidak tersedia";
  if (z < -3) return "Sangat kurus (severely underweight)";
  if (z < -2) return "Kurus (underweight)";
  if (z <= 2) return "Normal";
  if (z <= 3) return "Berat badan di atas normal";
  return "Berat badan sangat tinggi";
}

function classifyBMI(z) {
  if (!Number.isFinite(z)) return "Data tidak tersedia";
  if (z < -3) return "Sangat kurus (severe thinness)";
  if (z < -2) return "Kurus (thinness)";
  if (z <= 1) return "Normal";
  if (z <= 2) return "Risiko overweight";
  if (z <= 3) return "Overweight";
  return "Obesitas";
}

function classifyWFL(index) {
  const mapping = [
    "Sangat kurus",
    "Kurus",
    "Normal",
    "Normal",
    "Normal",
    "Risiko overweight",
    "Overweight",
    "Obesitas"
  ];
  if (index < 0 || index >= mapping.length || !Number.isFinite(index)) {
    return "Di luar grafik";
  }
  return mapping[index];
}

function analyzeLinearMetric(metric, gender, age, value, data, lmsData, options = {}) {
  const metricData = getNested(data, [gender, metric], []);
  const lms = getNested(lmsData, [gender, metric, age], null);
  const z = computeZScore(lms, value);
  const percentile = zToPercentile(z);
  const entry = metricData ? metricData[age] : null;
  const median = entry && entry.length ? entry[3] : (lms ? lms[1] : NaN);
  const diff = Number.isFinite(value) && Number.isFinite(median) ? value - median : NaN;

  const units = typeof options.units !== "undefined" ? options.units : (metric === "bfa" ? " kg/m²" : metric === "wfa" ? " kg" : " cm");
  const measurementLabel = typeof options.valueLabel !== "undefined"
    ? options.valueLabel
    : (metric === "bfa" ? "BMI" : metric === "wfa" ? "Berat" : "Tinggi");
  const decimals = typeof options.decimals !== "undefined" ? options.decimals : 1;

  let classification;
  if (metric === "lfa") classification = classifyHeight(z);
  else if (metric === "wfa") classification = classifyWeight(z);
  else classification = classifyBMI(z);

  const diffText = Number.isFinite(diff)
    ? `${diff >= 0 ? "+" : ""}${formatNumber(diff, decimals)}${units}`
    : "-";

  return {
    title: options.title,
    measurementLabel,
    measurement: `${formatNumber(value, decimals)}${units}`,
    median: `${formatNumber(median, decimals)}${units}`,
    diff: diffText,
    z: Number.isFinite(z) ? z.toFixed(2) : "-",
    percentile: Number.isFinite(percentile) ? `${percentile.toFixed(1)}%` : "-",
    classification,
    measurementValue: Number.isFinite(value) ? value : null,
    medianValue: Number.isFinite(median) ? median : null,
    diffValue: Number.isFinite(diff) ? diff : null,
    zScore: Number.isFinite(z) ? z : null,
    percentileValue: Number.isFinite(percentile) ? percentile : null,
  };
}

function analyzeWFL(gender, length, weight, data) {
  const dataset = getNested(data, [gender, "wfl"], []);
  const index = Math.round((length - 40) * 2);
  const arr = dataset ? dataset[index] : null;
  let statusIdx = 0;
  if (arr) {
    while (statusIdx < arr.length && weight >= arr[statusIdx]) {
      statusIdx += 1;
    }
  } else {
    statusIdx = -1;
  }
  const classification = classifyWFL(statusIdx);
  const median = arr ? arr[3] : NaN;
  const diff = Number.isFinite(median) ? weight - median : NaN;
  const diffText = Number.isFinite(diff) ? `${diff >= 0 ? "+" : ""}${formatNumber(diff)} kg` : "-";
  const medianText = Number.isFinite(median) ? `${formatNumber(median)} kg` : "-";

  return {
    title: "Berat terhadap panjang badan",
    measurementLabel: "Berat",
    measurement: `${formatNumber(weight)} kg`,
    median: medianText,
    diff: diffText,
    z: "-",
    percentile: "-",
    classification,
    measurementValue: Number.isFinite(weight) ? weight : null,
    medianValue: Number.isFinite(median) ? median : null,
    diffValue: Number.isFinite(diff) ? diff : null,
    zScore: null,
    percentileValue: null,
  };
}

function AnalysisCard({ result }) {
  return (
    <article className="card">
      <div>
        <h3>{result.title}</h3>
        <span className="status-pill">
          <span aria-hidden="true">●</span>
          {result.classification}
        </span>
      </div>
      <ul className="detail-list">
        <li>
          <strong>{result.measurementLabel}</strong> {result.measurement}
        </li>
        <li>Median (z=0): {result.median}</li>
        <li>Selisih terhadap median: {result.diff}</li>
        {result.z !== "-" && (
          <li>
            Z-score: {result.z} (Persentil {result.percentile})
          </li>
        )}
      </ul>
    </article>
  );
}

function drawAnalysisCanvas(canvas, analysis, fallbackTitle) {
  if (!canvas) {
    return;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  let width = rect.width;
  let height = rect.height;
  if (!width || !height) {
    width = canvas.width || 420;
    height = canvas.height || 180;
  }
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.scale(ratio, ratio);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#0f172a";
  context.fillRect(0, 0, width, height);

  const headerText = analysis && analysis.title ? analysis.title : fallbackTitle;
  context.fillStyle = "rgba(226, 232, 240, 0.78)";
  context.font = "14px \"Inter\", \"Segoe UI\", sans-serif";
  context.fillText(headerText, 18, 28);

  if (!analysis) {
    context.fillStyle = "rgba(148, 163, 184, 0.7)";
    context.font = "13px \"Inter\", \"Segoe UI\", sans-serif";
    context.fillText("Belum ada analisis. Isi formulir di panel kiri.", 18, height / 2);
    return;
  }

  const axisY = height / 2 + 10;
  const left = 60;
  const right = width - 40;
  const zScore = analysis.zScore;
  const diffValue = analysis.diffValue;

  let gaugeMin = -3;
  let gaugeMax = 3;
  let gaugeStep = 1;
  let markerValue = null;
  if (zScore !== null) {
    markerValue = zScore;
  } else if (diffValue !== null) {
    gaugeMin = -4;
    gaugeMax = 4;
    gaugeStep = 2;
    markerValue = diffValue;
  }

  context.strokeStyle = "rgba(148, 163, 184, 0.3)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(left, axisY);
  context.lineTo(right, axisY);
  context.stroke();

  const range = gaugeMax - gaugeMin;
  for (let tick = gaugeMin; tick <= gaugeMax; tick += gaugeStep) {
    const ratioTick = (tick - gaugeMin) / range;
    const tickX = left + ratioTick * (right - left);
    context.beginPath();
    context.moveTo(tickX, axisY - 12);
    context.lineTo(tickX, axisY + 12);
    context.stroke();
    context.fillStyle = "rgba(148, 163, 184, 0.8)";
    context.font = "12px \"Inter\", \"Segoe UI\", sans-serif";
    context.fillText(String(tick), tickX - 6, axisY + 26);
  }

  const zeroRatio = (0 - gaugeMin) / range;
  const zeroX = left + zeroRatio * (right - left);
  context.fillStyle = "#38bdf8";
  context.beginPath();
  context.arc(zeroX, axisY, 7, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(226, 232, 240, 0.88)";
  context.font = "12px \"Inter\", \"Segoe UI\", sans-serif";
  context.fillText("Median", zeroX - 28, axisY - 16);

  if (markerValue !== null) {
    let clamped = markerValue;
    if (clamped < gaugeMin) clamped = gaugeMin;
    if (clamped > gaugeMax) clamped = gaugeMax;
    const pointRatio = (clamped - gaugeMin) / range;
    const pointX = left + pointRatio * (right - left);
    context.fillStyle = "#f97316";
    context.beginPath();
    context.arc(pointX, axisY, 9, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff";
    context.font = "10px \"Inter\", \"Segoe UI\", sans-serif";
    context.fillText("★", pointX - 5, axisY + 3);
    context.fillStyle = "rgba(248, 250, 252, 0.88)";
    context.font = "12px \"Inter\", \"Segoe UI\", sans-serif";
    context.fillText("Pasien", pointX - 24, axisY + 30);
  }

  context.fillStyle = "rgba(148, 163, 184, 0.85)";
  context.font = "12px \"Inter\", \"Segoe UI\", sans-serif";
  const detailLine = `${analysis.measurementLabel}: ${analysis.measurement} • Median: ${analysis.median}`;
  context.fillText(detailLine, 18, height - 48);

  context.fillStyle = "rgba(226, 232, 240, 0.82)";
  context.font = "13px \"Inter\", \"Segoe UI\", sans-serif";
  context.fillText(`Status: ${analysis.classification}`, 18, height - 28);

  if (analysis.percentileValue !== null) {
    const percentileLine = `Persentil: ${analysis.percentileValue.toFixed(1)}%`;
    context.fillText(percentileLine, 18, height - 10);
  } else if (analysis.diff) {
    context.fillText(`Selisih: ${analysis.diff}`, 18, height - 10);
  }
}

function AnalysisCanvas({ analysis, fallbackTitle }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    drawAnalysisCanvas(canvasRef.current, analysis, fallbackTitle);
  }, [analysis, fallbackTitle]);

  const badgeLabel = analysis && analysis.classification ? analysis.classification : "Menunggu data";

  return (
    <div className="canvas-wrapper" data-title={badgeLabel}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [lmsData, setLmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    gender: "boys",
    age: 0,
    weight: 3.8,
    height: 50,
  });
  const [analysis, setAnalysis] = useState([]);

  useEffect(() => {
    fetch("data_extended.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Status " + res.status);
        }
        return res.json();
      })
      .then((payload) => {
        setData(payload);
        setLmsData(payload && typeof payload.lms !== "undefined" ? payload.lms : null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err && err.message ? err.message : "Gagal memuat data");
        setLoading(false);
      });
  }, []);

  const ageOptions = useMemo(() => {
    const options = [];
    for (let month = 0; month <= 120; month += 1) {
      const baseLabel = month + " bulan";
      if (month % 12 === 0) {
        options.push({ value: month, label: baseLabel + " (" + month / 12 + " th)" });
      } else {
        options.push({ value: month, label: baseLabel });
      }
    }
    return options;
  }, []);

  const handleChange = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setForm((prev) => {
      if (name === "gender") {
        return {
          gender: value,
          age: prev.age,
          weight: prev.weight,
          height: prev.height,
        };
      }
      const numeric = value === "" ? "" : Number(value);
      const next = {
        gender: prev.gender,
        age: prev.age,
        weight: prev.weight,
        height: prev.height,
      };
      next[name] = numeric;
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!data) {
      return;
    }

    const gender = form.gender;
    const age = form.age;
    const weight = form.weight;
    const height = form.height;
    const validations = [];

    if (!Number.isInteger(age) || age < 0 || age > 120) {
      validations.push("Umur harus di antara 0-120 bulan.");
    }
    if (!Number.isFinite(height) || height <= 0) {
      validations.push("Tinggi badan harus lebih besar dari 0.");
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      validations.push("Berat badan harus lebih besar dari 0.");
    }

    if (validations.length) {
      alert(validations.join("\n"));
      return;
    }

    const results = [];
    results.push(
      analyzeLinearMetric("lfa", gender, age, height, data, lmsData, {
        title: "Tinggi badan menurut umur",
      })
    );

    results.push(
      analyzeLinearMetric("wfa", gender, age, weight, data, lmsData, {
        title: "Berat badan menurut umur",
        units: " kg",
      })
    );

    if (age <= 24) {
      results.push(analyzeWFL(gender, height, weight, data));
    } else {
      const heightMeters = height / 100;
      const bmi = weight / (heightMeters * heightMeters);
      results.push(
        analyzeLinearMetric("bfa", gender, age, bmi, data, lmsData, {
          title: "Indeks massa tubuh (BMI) menurut umur",
          units: " kg/m²",
          valueLabel: "BMI",
          decimals: 2,
        })
      );
    }

    setAnalysis(results);
  };

  const statusMessage = loading
    ? "Memuat data referensi..."
    : error
      ? "Gagal memuat data"
      : "Data referensi siap";

  const canvasFallbacks = [
    "Tinggi vs Umur",
    "Berat vs Umur",
    form.age <= 24 ? "Berat vs Panjang" : "BMI vs Umur",
  ];

  return (
    <div className="layout" id="dashboard">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__brand-badge">GI</span>
          <div>
            Growth Insights
            <div style={{ fontSize: "12px", fontWeight: 500, color: "rgba(226, 232, 240, 0.75)" }}>Admin Panel</div>
          </div>
        </div>
        <div>
          <p className="sidebar__section-title">Navigasi</p>
          <nav className="sidebar__menu">
            <a href="#dashboard" className="sidebar__link active">
              <span>Dasbor Utama</span>
              <span className="sidebar__link-indicator">●</span>
            </a>
            <a href="#insights" className="sidebar__link">
              <span>Ringkasan Analisis</span>
              <span className="sidebar__link-indicator">›</span>
            </a>
            <a href="#visual" className="sidebar__link">
              <span>Visualisasi</span>
              <span className="sidebar__link-indicator">›</span>
            </a>
          </nav>
        </div>
        <div className="sidebar__footer">
          Dataset pertumbuhan WHO/CDC 0–120 bulan. Dashboard diperbarui setiap kali input baru diproses.
        </div>
      </aside>
      <div className="main">
        <header className="main__header">
          <div>
            <h1 className="main__title">Growth Insights Admin</h1>
            <p className="main__subtitle">
              Kelola interpretasi pertumbuhan anak dan pantau status gizi secara real-time.
            </p>
          </div>
          <span className="main__status">
            <span aria-hidden="true">●</span>
            {statusMessage}
          </span>
        </header>
        <div className="workspace">
          <section className="panel">
            <div>
              <h2 className="panel__title">Input Pemeriksaan</h2>
              <p className="panel__caption">Masukkan detail pemeriksaan terbaru untuk melihat insight otomatis.</p>
            </div>
            <div className="divider"></div>
            <form className="input-grid" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="gender">Jenis kelamin</label>
                <select
                  id="gender"
                  name="gender"
                  className="select"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="boys">Laki-laki</option>
                  <option value="girls">Perempuan</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="age">Umur (bulan)</label>
                <select
                  id="age"
                  name="age"
                  className="select"
                  value={form.age}
                  onChange={handleChange}
                >
                  {ageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="weight">Berat badan (kg)</label>
                <input
                  id="weight"
                  name="weight"
                  className="input"
                  type="number"
                  value={form.weight}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="field">
                <label htmlFor="height">Tinggi badan (cm)</label>
                <input
                  id="height"
                  name="height"
                  className="input"
                  type="number"
                  value={form.height}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                />
              </div>
              <button className="submit-btn" type="submit" disabled={loading || Boolean(error)}>
                {loading ? "Memuat data..." : "Proses Analisis"}
              </button>
            </form>
          </section>
          <section className="panel" id="insights">
            <div>
              <h2 className="panel__title">Ringkasan Analisis</h2>
              <p className="panel__caption">Interpretasi status pertumbuhan berdasarkan standar WHO/CDC.</p>
            </div>
            <div className="divider"></div>
            {error && <p className="feedback">Gagal memuat data: {error}</p>}
            {!error && analysis.length === 0 && !loading && (
              <p className="feedback">Masukkan data dan klik "Proses Analisis" untuk menampilkan ringkasan.</p>
            )}
            {analysis.length > 0 && (
              <div className="results-grid">
                {analysis.map((result) => (
                  <AnalysisCard key={result.title} result={result} />
                ))}
              </div>
            )}
          </section>
        </div>
        <section className="panel canvas-panel" id="visual">
          <div>
            <h2 className="panel__title">Visualisasi Cepat</h2>
            <p className="panel__caption">Lihat posisi pasien terhadap median dan distribusi z-score.</p>
          </div>
          <div className="divider"></div>
          <div className="canvas-grid">
            {canvasFallbacks.map((fallbackTitle, index) => (
              <AnalysisCanvas
                key={fallbackTitle}
                analysis={analysis[index] ? analysis[index] : null}
                fallbackTitle={fallbackTitle}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

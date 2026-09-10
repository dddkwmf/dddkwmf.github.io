const $ = (id) => document.getElementById(id);
const API_URL = window.DASHBOARD_API_URL || "";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeWording(value) {
  return String(value || "").replace(/\u8fdf\u5230/g, "\u8fdf\u6253\u5361");
}

function deductionText(item) {
  if (item.text) return normalizeWording(item.text);
  const status = normalizeWording(item.status || "");
  const points = item.points ? `\u6263${item.points}\u5206` : "";
  return `${item.date || ""}${status}${points}`;
}

function renderDeductionRows(student) {
  const deductions = student.deductions || [];
  if (!deductions.length) {
    return `<tr class="detail-row"><td colspan="3">\u6682\u65e0\u6263\u5206</td><td>0</td></tr>`;
  }
  return deductions.map((item) => `
    <tr class="detail-row">
      <td colspan="3">${escapeHtml(deductionText(item))}</td>
      <td>-${escapeHtml(item.points || 0)}</td>
    </tr>
  `).join("");
}

function renderStudent(student) {
  const maskedName = escapeHtml(student.maskedName || "-");
  const className = escapeHtml(student.className || "");
  const maskedStudentId = escapeHtml(student.maskedStudentId || "");
  const score = Number(student.score ?? 100);

  $("result-heading").textContent = `${student.maskedName || "\u672c\u4eba"}\u7684\u8bb0\u5f55`;
  $("student-rows").innerHTML = `
    <tr class="summary-row">
      <td class="person-name">${maskedName}</td>
      <td class="person-meta"><span>${className}</span><span>\u5b66\u53f7\uff1a${maskedStudentId}</span></td>
      <td class="score-heading">\u7d2f\u8ba1\u5f97\u5206</td>
      <td class="score-number${score < 95 ? " low" : ""}">${escapeHtml(score)}</td>
    </tr>
    <tr class="section-row">
      <td colspan="3">\u91cf\u5316\u8003\u6838</td>
      <td>\u5206\u503c</td>
    </tr>
    ${renderDeductionRows(student)}
  `;
  $("result-panel").classList.remove("hidden");
}

async function lookup() {
  const studentId = $("student-id").value.trim();
  $("lookup-error").textContent = "";
  $("result-panel").classList.add("hidden");
  if (!studentId) {
    $("lookup-error").textContent = "\u8bf7\u8f93\u5165\u5b8c\u6574\u5b66\u53f7\u3002";
    return;
  }
  if (!API_URL) {
    $("lookup-error").textContent = "\u6682\u65f6\u65e0\u6cd5\u67e5\u8be2\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002";
    return;
  }
  $("lookup-button").disabled = true;
  $("lookup-button").textContent = "\u67e5\u8be2\u4e2d";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_URL}?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store", signal: controller.signal });
    if (response.status === 404) throw new Error("not-found");
    if (response.status === 429) throw new Error("rate-limited");
    if (!response.ok) throw new Error("request-failed");
    renderStudent(await response.json());
  } catch (error) {
    const messages = {
      "not-found": "未找到该学号的记录。",
      "rate-limited": "查询人数较多，请一分钟后重试。（E429）",
      "request-failed": "查询服务暂时异常，请稍后重试。（ESERVICE）",
    };
    $("lookup-error").textContent = error.name === "AbortError"
      ? "连接查询服务超时，请切换网络后重试。（ETIMEOUT）"
      : messages[error.message] || "无法连接查询服务，请尝试关闭 VPN 或切换手机流量。（ENETWORK）";
  } finally {
    clearTimeout(timeout);
    $("lookup-button").disabled = false;
    $("lookup-button").textContent = "\u67e5\u8be2";
  }
}

$("lookup-button").addEventListener("click", lookup);
$("student-id").addEventListener("keydown", (event) => { if (event.key === "Enter") lookup(); });

const $ = (id) => document.getElementById(id);
const API_URL = window.DASHBOARD_API_URL || "";

function renderDetails(student) {
  if (!student.deductions || !student.deductions.length) return "\u6682\u65e0\u6263\u5206";
  return student.deductions.map((item) => item.text || `${item.date}${item.status}`).join("<br>");
}

function renderPointDetails(student) {
  if (!student.deductions || !student.deductions.length) return "0";
  return student.deductions.map((item) => `-${item.points}`).join("<br>");
}

function renderStudent(student) {
  $("result-heading").textContent = `${student.maskedName || "\u672c\u4eba"}\u7684\u8bb0\u5f55`;
  $("student-rows").innerHTML = `
    <tr class="student-block top-row">
      <td class="name-cell" rowspan="2"><span class="name">${student.maskedName || "-"}</span><span class="class-name">${student.className || ""}</span><span class="class-name">${student.maskedStudentId || ""}</span></td>
      <td class="score-label">\u7d2f\u8ba1\u5f97\u5206</td>
      <td class="audit-label">\u91cf\u5316\u8003\u6838</td>
      <td class="audit-detail">${renderDetails(student)}</td>
    </tr>
    <tr class="student-block bottom-row">
      <td class="score-value${student.score < 95 ? " low" : ""}">${student.score}</td>
      <td class="points-label">\u5206\u503c</td>
      <td class="points-value">${renderPointDetails(student)}</td>
    </tr>
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
    $("lookup-error").textContent = "\u6570\u636e\u63a5\u53e3\u5c1a\u672a\u914d\u7f6e\uff0c\u5f53\u524d\u53ea\u662f\u516c\u5f00\u9875\u9762\u58f3\u3002";
    return;
  }
  $("lookup-button").disabled = true;
  $("lookup-button").textContent = "\u67e5\u8be2\u4e2d";
  try {
    const response = await fetch(`${API_URL}?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" });
    if (response.status === 404) throw new Error("not-found");
    if (!response.ok) throw new Error("request-failed");
    renderStudent(await response.json());
  } catch (error) {
    $("lookup-error").textContent = error.message === "not-found" ? "\u672a\u627e\u5230\u8BE5\u5B66\u53F7\u7684\u8BB0\u5F55\u3002" : "\u67E5\u8BE2\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002";
  } finally {
    $("lookup-button").disabled = false;
    $("lookup-button").textContent = "\u67e5\u8be2";
  }
}

$("lookup-button").addEventListener("click", lookup);
$("student-id").addEventListener("keydown", (event) => { if (event.key === "Enter") lookup(); });

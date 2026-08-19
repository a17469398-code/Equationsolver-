let memory = 0, calculationHistory = [], isCalculating = false;
const expression = document.getElementById('expression');
const result = document.getElementById('result');
const historyList = document.getElementById('historyList');

document.addEventListener('DOMContentLoaded', () => {
  expression.focus();
  loadHistory();
});

function add(value) {
  if (isCalculating) return;
  expression.value += value;
  updatePreview();
}

function clearAll() {
  expression.value = '';
  result.textContent = '0';
  expression.focus();
}

function backspace() {
  expression.value = expression.value.slice(0, -1);
  updatePreview();
}

function calculate() {
  if (isCalculating) return;
  const exp = expression.value.trim();
  if (!exp) { result.textContent = '0'; return; }
  try {
    isCalculating = true;
    let processedExp = processExpression(exp);
    let answer = evaluateExpression(processedExp);
    if (!Number.isFinite(answer)) { result.textContent = 'Error'; isCalculating = false; return; }
    answer = parseFloat(answer.toFixed(10));
    result.textContent = formatNumber(answer);
    addToHistory(exp, answer);
  } catch (e) {
    result.textContent = 'Error';
    console.error('Calc Error:', e);
  } finally { isCalculating = false; }
}

function processExpression(exp) {
  exp = exp.replace(/\s+/g, '');
  return exp
    .replace(/π/g, 'Math.PI')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/sin\(/g, 'Math.sin(degreesToRadians(')
    .replace(/cos\(/g, 'Math.cos(degreesToRadians(')
    .replace(/tan\(/g, 'Math.tan(degreesToRadians(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/\^/g, '**');
}

function evaluateExpression(exp) {
  const func = new Function('Math', 'degreesToRadians', `"use strict"; return (${exp})`);
  return func(Math, (d) => d * (Math.PI / 180));
}

function formatNumber(num) {
  if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) return num.toExponential(6);
  if (Number.isInteger(num)) return String(num);
  return String(num).replace(/\.?0+$/, '');
}

function updatePreview() {
  const exp = expression.value.trim();
  if (!exp) { result.textContent = '0'; return; }
  try {
    if (/[+\-*/^(]$/.test(exp) || exp.length > 1000) return;
    let preview = processExpression(exp);
    let temp = evaluateExpression(preview);
    if (Number.isFinite(temp)) result.textContent = formatNumber(parseFloat(temp.toFixed(10)));
  } catch (e) {}
}

function addToHistory(exp, ans) {
  const item = { expression: exp, answer: ans, timestamp: new Date().getTime() };
  calculationHistory.unshift(item);
  if (calculationHistory.length > 50) calculationHistory.pop();
  renderHistoryList();
  saveHistory();
}

function renderHistoryList() {
  historyList.innerHTML = '';
  if (calculationHistory.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.cssText = 'text-align: center; color: var(--text-secondary); font-size: 12px; padding: 16px 8px; opacity: 0.6;';
    emptyMsg.textContent = 'No calculations yet';
    historyList.appendChild(emptyMsg);
    return;
  }
  calculationHistory.forEach((item, index) => {
    const div = document.createElement('div');
    const formatted = `${item.expression} = ${formatNumber(item.answer)}`;
    const textSpan = document.createElement('span');
    textSpan.textContent = formatted;
    textSpan.style.flex = '1';
    const indexSpan = document.createElement('span');
    indexSpan.textContent = `#${calculationHistory.length - index}`;
    div.appendChild(textSpan);
    div.appendChild(indexSpan);
    div.addEventListener('click', () => {
      expression.value = item.expression;
      result.textContent = formatNumber(item.answer);
    });
    historyList.appendChild(div);
  });
}

function clearHistory() {
  if (calculationHistory.length === 0) return;
  if (confirm('Clear calculation history?')) {
    calculationHistory = [];
    renderHistoryList();
    saveHistory();
  }
}

function saveHistory() {
  try { localStorage.setItem('calculatorHistory', JSON.stringify(calculationHistory)); }
  catch (e) { console.warn('Could not save history:', e); }
}

function loadHistory() {
  try {
    const saved = localStorage.getItem('calculatorHistory');
    if (saved) { calculationHistory = JSON.parse(saved); renderHistoryList(); }
  } catch (e) { console.warn('Could not load history:', e); }
}

function memoryClear() { memory = 0; showNotification('Memory cleared'); }
function memoryRecall() {
  if (memory !== 0) { expression.value += memory; updatePreview(); showNotification(`M: ${formatNumber(memory)}`); }
  else showNotification('Memory empty');
}
function memoryAdd() {
  calculate();
  const val = parseFloat(result.textContent);
  if (!isNaN(val)) { memory += val; showNotification(`M+: ${formatNumber(memory)}`); }
}
function memorySubtract() {
  calculate();
  const val = parseFloat(result.textContent);
  if (!isNaN(val)) { memory -= val; showNotification(`M-: ${formatNumber(memory)}`); }
}

function showNotification(msg) {
  const notif = document.createElement('div');
  notif.textContent = msg;
  notif.style.cssText = `position: fixed; top: 12px; right: 12px; background: #111827; color: white; padding: 10px 14px; border-radius: 8px; font-size: 12px; z-index: 1000; animation: slideInRight 0.3s ease; max-width: 200px; word-break: break-word;`;
  document.body.appendChild(notif);
  setTimeout(() => { notif.style.animation = 'slideOutRight 0.3s ease'; setTimeout(() => notif.remove(), 300); }, 1500);
}

expression.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); calculate(); }
  if (e.key === 'Escape') { e.preventDefault(); clearAll(); }
});

expression.addEventListener('input', () => { updatePreview(); });

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { alert('Voice not supported. Use Chrome, Edge, or Firefox.'); return; }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  const voiceBtn = document.querySelector('.voice-btn');
  const originalText = voiceBtn.textContent;
  voiceBtn.textContent = '🎤 Listening...';
  voiceBtn.disabled = true;
  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
    if (transcript) {
      const mathExpression = convertVoiceToMath(transcript.toLowerCase().trim());
      if (mathExpression) { expression.value = mathExpression; updatePreview(); }
    }
  };
  recognition.onerror = (event) => { showNotification('Voice error'); };
  recognition.onend = () => { voiceBtn.textContent = originalText; voiceBtn.disabled = false; };
  try { recognition.start(); } catch (e) { voiceBtn.textContent = originalText; voiceBtn.disabled = false; }
}

function convertVoiceToMath(text) {
  if (!text) return '';
  let math = text
    .replace(/\bplus\b/g, '+').replace(/\badd\b/g, '+')
    .replace(/\bminus\b/g, '-').replace(/\bsubtract\b/g, '-')
    .replace(/\bmultiply\s+by\b/g, '*').replace(/\btimes\b/g, '*')
    .replace(/\bdivide\s+by\b/g, '/').replace(/\bdivision\b/g, '/')
    .replace(/\bopen\s+bracket\b/g, '(').replace(/\bclose\s+bracket\b/g, ')')
    .replace(/\bpoint\b/g, '.').replace(/\bpi\b/g, 'π')
    .replace(/\bsquare\s+root\b/g, 'sqrt(').replace(/\bpower\b/g, '^')
    .replace(/\bsquared\b/g, '^2').replace(/\bcubed\b/g, '^3')
    .replace(/\bsine\b/g, 'sin(').replace(/\bcosine\b/g, 'cos(')
    .replace(/\btangent\b/g, 'tan(').replace(/\blogarithm\b/g, 'log(')
    .replace(/\bnatural\s+log\b/g, 'ln(')
    .replace(/\s+/g, '');
  const openCount = (math.match(/\(/g) || []).length;
  const closeCount = (math.match(/\)/g) || []).length;
  if (openCount > closeCount) math += ')'.repeat(openCount - closeCount);
  return math;
}

const style = document.createElement('style');
style.textContent = `@keyframes slideInRight { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }`;
document.head.appendChild(style);

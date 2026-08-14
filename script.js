// State Management
let memory = 0;
let calculationHistory = [];

// DOM Elements
const expression = document.getElementById('expression');
const result = document.getElementById('result');
const historyList = document.getElementById('historyList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  expression.focus();
  loadHistory();
});

/**
 * Add value to expression
 * @param {string} value - Value to add
 */
function add(value) {
  expression.value += value;
  expression.focus();
  updatePreview();
}

/**
 * Clear all input and result
 */
function clearAll() {
  expression.value = '';
  result.textContent = '0';
  expression.focus();
}

/**
 * Delete last character from expression
 */
function backspace() {
  expression.value = expression.value.slice(0, -1);
  updatePreview();
  expression.focus();
}

/**
 * Calculate the expression result
 */
function calculate() {
  const exp = expression.value.trim();

  if (!exp) {
    result.textContent = '0';
    return;
  }

  try {
    let processedExp = processExpression(exp);
    let answer = evaluateExpression(processedExp);

    // Validate result
    if (!Number.isFinite(answer)) {
      result.textContent = 'Error: Invalid Result';
      return;
    }

    // Format result (limit decimal places)
    answer = parseFloat(answer.toFixed(10));
    result.textContent = formatNumber(answer);

    // Add to history
    addToHistory(exp, answer);

  } catch (error) {
    result.textContent = 'Error: ' + error.message;
    console.error('Calculation Error:', error);
  }
}

/**
 * Process mathematical expressions
 * @param {string} exp - Expression to process
 * @returns {string} Processed expression
 */
function processExpression(exp) {
  return exp
    .replace(/π/g, 'Math.PI')
    .replace(/√/g, 'Math.sqrt')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/sin\(/g, 'Math.sin(degreesToRadians(')
    .replace(/cos\(/g, 'Math.cos(degreesToRadians(')
    .replace(/tan\(/g, 'Math.tan(degreesToRadians(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/\^/g, '**')
    .replace(/sin\(/g, 'Math.sin(degreesToRadians(')
    .replace(/cos\(/g, 'Math.cos(degreesToRadians(')
    .replace(/tan\(/g, 'Math.tan(degreesToRadians(');
}

/**
 * Safely evaluate mathematical expression
 * @param {string} exp - Expression to evaluate
 * @returns {number} Result
 */
function evaluateExpression(exp) {
  // Create a safe function to evaluate
  const func = new Function(
    'Math',
    'degreesToRadians',
    `"use strict";
    return (${exp})`
  );
  return func(Math, degreesToRadians);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format number for display
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  if (typeof num !== 'number') return String(num);
  
  // Handle very large or very small numbers
  if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(6);
  }
  
  // Format with appropriate decimal places
  if (Number.isInteger(num)) {
    return String(num);
  }
  
  return String(num).replace(/\.?0+$/, '');
}

/**
 * Update preview of calculation
 */
function updatePreview() {
  const exp = expression.value.trim();
  if (!exp) {
    result.textContent = '0';
    return;
  }
  
  // Only auto-calculate for simple expressions
  try {
    if (/[+\-*/()]$/.test(exp)) return; // Don't calculate incomplete expressions
    
    let preview = processExpression(exp);
    let temp = evaluateExpression(preview);
    
    if (Number.isFinite(temp)) {
      result.textContent = formatNumber(parseFloat(temp.toFixed(10)));
    }
  } catch (e) {
    // Silently fail on preview - user might still be typing
  }
}

/**
 * Add calculation to history
 * @param {string} exp - Expression
 * @param {number} ans - Answer
 */
function addToHistory(exp, ans) {
  const item = {
    expression: exp,
    answer: ans,
    timestamp: new Date().getTime()
  };

  calculationHistory.unshift(item);
  
  // Keep only last 50 items
  if (calculationHistory.length > 50) {
    calculationHistory.pop();
  }

  renderHistoryList();
  saveHistory();
}

/**
 * Render history list in DOM
 */
function renderHistoryList() {
  historyList.innerHTML = '';

  calculationHistory.forEach((item, index) => {
    const div = document.createElement('div');
    const formatted = `${item.expression} = ${formatNumber(item.answer)}`;
    div.innerHTML = `<span>${formatted}</span><span style="font-size: 11px; opacity: 0.5;">#${calculationHistory.length - index}</span>`;
    
    div.onclick = () => {
      expression.value = item.expression;
      result.textContent = formatNumber(item.answer);
      expression.focus();
    };

    historyList.appendChild(div);
  });
}

/**
 * Clear calculation history
 */
function clearHistory() {
  if (calculationHistory.length === 0) return;
  
  if (confirm('Are you sure you want to clear the calculation history?')) {
    calculationHistory = [];
    historyList.innerHTML = '';
    saveHistory();
  }
}

/**
 * Save history to localStorage
 */
function saveHistory() {
  try {
    localStorage.setItem('calculatorHistory', JSON.stringify(calculationHistory));
  } catch (e) {
    console.warn('Could not save history to localStorage:', e);
  }
}

/**
 * Load history from localStorage
 */
function loadHistory() {
  try {
    const saved = localStorage.getItem('calculatorHistory');
    if (saved) {
      calculationHistory = JSON.parse(saved);
      renderHistoryList();
    }
  } catch (e) {
    console.warn('Could not load history from localStorage:', e);
  }
}

// MEMORY FUNCTIONS

/**
 * Clear memory
 */
function memoryClear() {
  memory = 0;
  showNotification('Memory cleared');
}

/**
 * Recall memory value
 */
function memoryRecall() {
  if (memory !== 0) {
    expression.value += memory;
    expression.focus();
    updatePreview();
    showNotification(`Memory: ${formatNumber(memory)}`);
  } else {
    showNotification('Memory is empty');
  }
}

/**
 * Add current result to memory
 */
function memoryAdd() {
  calculate();
  const val = parseFloat(result.textContent);
  if (!isNaN(val)) {
    memory += val;
    showNotification(`Added to Memory: ${formatNumber(memory)}`);
  }
}

/**
 * Subtract current result from memory
 */
function memorySubtract() {
  calculate();
  const val = parseFloat(result.textContent);
  if (!isNaN(val)) {
    memory -= val;
    showNotification(`Subtracted from Memory: ${formatNumber(memory)}`);
  }
}

/**
 * Show notification message
 * @param {string} msg - Message to show
 */
function showNotification(msg) {
  // Create temporary notification
  const notif = document.createElement('div');
  notif.textContent = msg;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #111827;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
    animation: slideInRight 0.3s ease;
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 2000);
}

// KEYBOARD INPUT

expression.addEventListener('keydown', (e) => {
  // Calculate on Enter
  if (e.key === 'Enter') {
    e.preventDefault();
    calculate();
  }
  
  // Clear on Escape
  if (e.key === 'Escape') {
    e.preventDefault();
    clearAll();
  }
});

expression.addEventListener('input', () => {
  updatePreview();
});

// VOICE RECOGNITION

/**
 * Start voice input
 */
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert('Voice recognition is not supported in your browser.\nPlease use Chrome, Edge, or Firefox.');
    return;
  }

  const recognition = new SpeechRecognition();
  
  // Set language and settings
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  const voiceBtn = document.querySelector('.voice-btn');
  voiceBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  voiceBtn.textContent = '🎤 Listening...';

  recognition.onstart = () => {
    console.log('Voice recognition started');
  };

  recognition.onresult = (event) => {
    let transcript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        console.log('Final transcript:', transcript);
      }
    }

    if (transcript) {
      const mathExpression = convertVoiceToMath(transcript.toLowerCase());
      expression.value = mathExpression;
      updatePreview();
    }
  };

  recognition.onerror = (event) => {
    console.error('Voice recognition error:', event.error);
    const errorMessages = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found.',
      'network': 'Network error. Please check your connection.',
      'permission-denied': 'Microphone permission denied.'
    };
    alert(errorMessages[event.error] || `Error: ${event.error}`);
  };

  recognition.onend = () => {
    voiceBtn.style.background = 'linear-gradient(135deg, #1f2937 0%, #111827 100%)';
    voiceBtn.textContent = '🎤 Voice Calculator';
    console.log('Voice recognition ended');
  };

  recognition.start();
}

/**
 * Convert voice input to mathematical expression
 * @param {string} text - Voice text
 * @returns {string} Mathematical expression
 */
function convertVoiceToMath(text) {
  let math = text
    // Basic operations
    .replace(/\bplus\b/g, '+')
    .replace(/\badd\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\bsubtract\b/g, '-')
    .replace(/\bsubtracted\b/g, '-')
    .replace(/\bmultiply\s+by\b/g, '*')
    .replace(/\bmultiplied\s+by\b/g, '*')
    .replace(/\btimes\b/g, '*')
    .replace(/\bdivide\s+by\b/g, '/')
    .replace(/\bdivided\s+by\b/g, '/')
    .replace(/\bdivision\b/g, '/')
    
    // Brackets
    .replace(/\bopen\s+bracket\b/g, '(')
    .replace(/\bopen\s+parenthes\w+\b/g, '(')
    .replace(/\bclose\s+bracket\b/g, ')')
    .replace(/\bclose\s+parenthes\w+\b/g, ')')
    .replace(/\bleft\s+paren\b/g, '(')
    .replace(/\bright\s+paren\b/g, ')')
    
    // Decimals and special
    .replace(/\bpoint\b/g, '.')
    .replace(/\bdecimal\b/g, '.')
    .replace(/\bpi\b/g, 'π')
    
    // Mathematical functions
    .replace(/\bsquare\s+root\s+of\b/g, 'sqrt(')
    .replace(/\bsqrt\b/g, 'sqrt')
    .replace(/\bpower\b/g, '^')
    .replace(/\bto\s+the\s+power\b/g, '^')
    .replace(/\bsquared\b/g, '^2')
    .replace(/\bcubed\b/g, '^3')
    .replace(/\bsinusoid\b/g, 'sin')
    .replace(/\bsine\b/g, 'sin')
    .replace(/\bcosine\b/g, 'cos')
    .replace(/\btangent\b/g, 'tan')
    .replace(/\blogarithm\b/g, 'log')
    .replace(/\bnatural\s+log\b/g, 'ln')
    
    // Remove spaces
    .replace(/\s+/g, '')
    
    // Fix common patterns
    .replace(/sqrt([0-9])/g, 'sqrt($1')
    .replace(/sin([0-9])/g, 'sin($1')
    .replace(/cos([0-9])/g, 'cos($1')
    .replace(/tan([0-9])/g, 'tan($1')
    .replace(/log([0-9])/g, 'log($1')
    .replace(/ln([0-9])/g, 'ln($1');

  // Count and fix unmatched parentheses
  const openCount = (math.match(/\(/g) || []).length;
  const closeCount = (math.match(/\)/g) || []).length;
  
  if (openCount > closeCount) {
    math += ')'.repeat(openCount - closeCount);
  }

  return math;
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

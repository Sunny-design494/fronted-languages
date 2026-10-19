// 获取 HTML 中的显示框和按钮容器；按钮点击由容器统一处理。
const resultInput = document.getElementById("result");
const buttons = document.querySelector(".buttons");
const operators = ["+", "-", "*", "/"];
let lastActionWasCalculation = false;

// 将数字、小数点或运算符追加到显示框。
function appendValue(value) {
  if (resultInput.value === "Error") {
    resultInput.value = "";
  }

  if (operators.includes(value)) {
    appendOperator(value);
    return;
  }

  if (lastActionWasCalculation) {
    resultInput.value = "";
    lastActionWasCalculation = false;
  }

  if (value === ".") {
    const currentEntry = resultInput.value.split(/[+\-*/]/).pop();
    if (currentEntry.includes(".")) {
      return;
    }
    resultInput.value += currentEntry === "" || currentEntry === "-" ? "0." : ".";
    return;
  }

  resultInput.value += value;
}

// 添加运算符，并处理连续运算符及负数输入。
function appendOperator(operator) {
  const expression = resultInput.value;
  if (expression === "") {
    if (operator === "-") {
      resultInput.value = operator;
    }
    return;
  }

  const lastCharacter = expression[expression.length - 1];
  if (!operators.includes(lastCharacter)) {
    resultInput.value += operator;
    lastActionWasCalculation = false;
    return;
  }

  const isUnaryMinus =
    lastCharacter === "-" &&
    (expression.length === 1 || operators.includes(expression[expression.length - 2]));

  if (operator === "-" && !isUnaryMinus) {
    resultInput.value += operator;
  } else if (isUnaryMinus) {
    resultInput.value = expression.slice(0, -1) + operator;
  } else {
    resultInput.value = expression.slice(0, -1) + operator;
  }
  lastActionWasCalculation = false;
}

// CE：只删除当前输入的数字，不清除前面的算式。
function clearEntry() {
  const expression = resultInput.value;
  if (expression === "Error") {
    clearAll();
    return;
  }

  let end = expression.length;

  while (end > 0 && /[\d.]/.test(expression[end - 1])) {
    end -= 1;
  }

  if (
    end > 0 &&
    expression[end - 1] === "-" &&
    (end === 1 || operators.includes(expression[end - 2]))
  ) {
    end -= 1;
  }

  resultInput.value = expression.slice(0, end);
  lastActionWasCalculation = false;
}

// C：清空显示框和计算状态。
function clearAll() {
  resultInput.value = "";
  lastActionWasCalculation = false;
}

// 退格：删除显示框中的最后一个字符。
function backspace() {
  if (resultInput.value === "Error") {
    clearAll();
    return;
  }
  resultInput.value = resultInput.value.slice(0, -1);
  lastActionWasCalculation = false;
}

// 递归下降解析器：按四则运算优先级计算表达式，避免执行任意代码。
function calculate(expression) {
  const tokens = expression.match(/\d+(?:\.\d*)?|\.\d+|[+\-*/]/g);
  if (!tokens || tokens.join("") !== expression) {
    throw new Error("Invalid expression");
  }

  let position = 0;

  // 解析数字或一元正负号，例如 -2。
  function parseFactor() {
    const token = tokens[position];
    if (token === "+" || token === "-") {
      position += 1;
      const value = parseFactor();
      return token === "-" ? -value : value;
    }

    if (!token || operators.includes(token)) {
      throw new Error("Expected a number");
    }

    position += 1;
    return Number(token);
  }

  // 先处理乘法和除法。
  function parseTerm() {
    let value = parseFactor();
    while (tokens[position] === "*" || tokens[position] === "/") {
      const operator = tokens[position];
      position += 1;
      const right = parseFactor();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  // 再处理加法和减法。
  function parseExpression() {
    let value = parseTerm();
    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position];
      position += 1;
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  const result = parseExpression();
  if (position !== tokens.length || !Number.isFinite(result)) {
    throw new Error("Invalid calculation");
  }
  return result;
}

// 点击等号时计算表达式；格式错误或无法计算时显示 Error。
function showResult() {
  try {
    resultInput.value = String(calculate(resultInput.value));
    lastActionWasCalculation = true;
  } catch {
    resultInput.value = "Error";
    lastActionWasCalculation = true;
  }
}

// 根据 HTML 按钮上的 data-action / data-value 执行对应操作。
buttons.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || !buttons.contains(button)) {
    return;
  }

  const action = button.dataset.action;
  if (action === "clear") {
    clearAll();
  } else if (action === "clear-entry") {
    clearEntry();
  } else if (action === "backspace") {
    backspace();
  } else if (action === "equals") {
    showResult();
  } else {
    appendValue(button.dataset.value);
  }
});

// backend-log lessons — shared code-typing practice widget
//
// 사용법 (레슨 HTML 안에서):
//   <div class="code-practice">
//     <p class="practice-prompt">...무엇을 타이핑해야 하는지 설명...</p>
//     <textarea class="practice-input" id="p1-input" spellcheck="false"></textarea>
//     <div class="practice-actions">
//       <button onclick="checkPractice('p1')">확인</button>
//       <button class="practice-reveal" onclick="revealPractice('p1')">정답 보기</button>
//     </div>
//     <div class="practice-result" id="p1-result"></div>
//   </div>
//   <script>
//     registerPractice('p1', {
//       accepted: ['int a = 10;'],      // 정답으로 인정할 코드 (여러 개 가능)
//       explain: '정답일 때 보여줄 설명',
//       hint: '틀렸을 때 보여줄 힌트 — 정답 자체를 노출하지 않는다',
//     });
//   </script>
//
// 채점 규칙: 공백·줄바꿈 차이는 전부 무시하고, 그 외(변수명·세미콜론·대소문자·기호)는 완전히 일치해야 정답.

const practiceRegistry = {};

function registerPractice(id, config) {
  practiceRegistry[id] = config;
}

function normalizePracticeCode(code) {
  return code.replace(/\s+/g, ' ').trim();
}

function checkPractice(id) {
  const config = practiceRegistry[id];
  const input = document.getElementById(id + '-input');
  const result = document.getElementById(id + '-result');
  if (!config || !input || !result) return;

  const submitted = normalizePracticeCode(input.value);
  const isCorrect = config.accepted.some(
    (answer) => normalizePracticeCode(answer) === submitted
  );

  input.classList.remove('correct', 'wrong');
  input.classList.add(isCorrect ? 'correct' : 'wrong');

  result.style.color = isCorrect ? 'var(--correct)' : 'var(--wrong)';
  result.textContent = isCorrect
    ? '✓ ' + (config.explain || '정확합니다.')
    : '✗ ' + (config.hint || '다시 확인해보세요.');
}

function revealPractice(id) {
  const config = practiceRegistry[id];
  const input = document.getElementById(id + '-input');
  const result = document.getElementById(id + '-result');
  if (!config || !input || !result) return;

  input.value = config.accepted[0];
  input.classList.remove('correct', 'wrong');
  result.style.color = 'var(--muted)';
  result.textContent = '정답을 채워넣었습니다. 지우고 직접 다시 타이핑해보세요.';
}

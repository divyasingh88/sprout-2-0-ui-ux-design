(() => {
  const content = document.getElementById("screen-content");
  const indicator = document.getElementById("step-indicator");
  const progress = document.getElementById("progress-value");
  const backButton = document.getElementById("back-button");
  const nextButton = document.getElementById("next-button");
  const answers = { goal: "", amount: "100" };
  let step = 0;
  let confirmed = false;

  const screens = [
    {
      title: "What brings you here?",
      description: "A good first step starts with what matters to you. Pick a topic to explore.",
      render: () => `
        <div class="choice-list" role="group" aria-label="Choose a topic">
          ${choice("goal", "Build a saving habit", "◷")}
          ${choice("goal", "Learn how investing works", "↗")}
          ${choice("goal", "Plan for something ahead", "⌁")}
        </div>`
    },
    {
      title: "Choose your first amount.",
      description: "You can start from ₹100. Choose an amount that fits your comfort—not someone else’s.",
      render: () => `
        <label class="field-label" for="amount-input">Your starting amount</label>
        <input class="amount-field" id="amount-input" type="number" min="100" step="1" inputmode="numeric" value="${escapeHtml(answers.amount)}" aria-describedby="amount-help">
        <p class="field-help" id="amount-help">The minimum to begin is ₹100. You can change this before you confirm.</p>
        <div class="amount-chips" aria-label="Quick amount choices">
          ${[100, 500, 1000].map(amount => `<button class="amount-chip" type="button" data-amount="${amount}" aria-pressed="${answers.amount === String(amount)}">₹${amount.toLocaleString("en-IN")}</button>`).join("")}
        </div>`
    },
    {
      title: "A quick heads-up.",
      description: "A couple of details help us verify your identity and set up your account.",
      render: () => `
        <div class="info-card"><strong>Keep these within reach</strong>Your PAN card and Aadhaar details. You’ll enter them securely in the app.</div>
        <div class="wait-card"><span class="wait-icon" aria-hidden="true">◎</span><span><strong>Before you begin:</strong> Use your own details and a phone number linked to your Aadhaar. If you need a moment to find your documents, you can come back.</span></div>`
    },
    {
      title: "Let’s verify it’s you.",
      description: "Your identity check is the next part of getting set up. We’ll show progress as it happens.",
      render: () => `
        <div class="info-card"><strong>What happens next</strong>Enter your PAN and Aadhaar details in the secure verification step, then follow the on-screen instructions.</div>
        <div class="wait-card"><span class="wait-icon" aria-hidden="true">◷</span><span>Verification can take a little time. You’ll see an in-progress status while we check—no need to tap again or start over.</span></div>
        <p class="field-help" style="margin-top:14px">This preview doesn’t collect or send personal information.</p>`
    },
    {
      title: "Your first step, reviewed.",
      description: "Take a moment to check your choice. You’ll only proceed when you confirm.",
      render: () => `
        <div class="choice-summary">
          <span class="summary-label">Your starting amount</span>
          <div class="summary-amount">₹${formatAmount(answers.amount)}</div>
          <p class="summary-note">Chosen by you. Not a promised return.</p>
        </div>
        <div class="wait-card"><span class="wait-icon" aria-hidden="true">↗</span><span>Investment values can fall as well as rise. Review the scheme information and risks in the app before placing an order.</span></div>
        ${confirmed ? '<p class="inline-status" role="status">Choice saved for this preview. Your next step would be the in-app order review.</p>' : ''}`
    }
  ];

  function choice(group, label, icon) {
    const selected = answers[group] === label;
    return `<button class="choice" type="button" data-group="${group}" data-value="${escapeHtml(label)}" aria-pressed="${selected}"><span class="choice-text"><span class="choice-icon" aria-hidden="true">${icon}</span>${label}</span><span class="choice-check" aria-hidden="true">✓</span></button>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function formatAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "100";
  }

  function draw() {
    const current = screens[step];
    indicator.textContent = `Step ${step + 1} of 5`;
    progress.style.width = `${(step + 1) * 20}%`;
    content.innerHTML = `<h3>${current.title}</h3><p class="screen-desc">${current.description}</p>${current.render()}`;
    backButton.disabled = step === 0;
    nextButton.textContent = step === 4 ? (confirmed ? "Saved" : "Confirm choice") : "Continue →";
    nextButton.setAttribute("aria-label", step === 4 ? "Confirm your choice" : "Continue to next step");
    if (step === 4 && confirmed) nextButton.disabled = true;
    else nextButton.disabled = false;
    bindScreenInputs();
  }

  function bindScreenInputs() {
    content.querySelectorAll(".choice").forEach(button => {
      button.addEventListener("click", () => {
        answers[button.dataset.group] = button.dataset.value;
        content.querySelectorAll(".choice").forEach(option => {
          option.setAttribute("aria-pressed", String(option === button));
        });
      });
    });
    const amountInput = content.querySelector("#amount-input");
    if (amountInput) {
      amountInput.addEventListener("input", () => {
        answers.amount = amountInput.value;
        content.querySelectorAll(".amount-chip").forEach(chip => {
          chip.setAttribute("aria-pressed", String(chip.dataset.amount === answers.amount));
        });
      });
      content.querySelectorAll(".amount-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          answers.amount = chip.dataset.amount;
          amountInput.value = answers.amount;
          content.querySelectorAll(".amount-chip").forEach(option => {
            option.setAttribute("aria-pressed", String(option === chip));
          });
        });
      });
    }
  }

  backButton.addEventListener("click", () => {
    if (step > 0) {
      step -= 1;
      draw();
    }
  });
  nextButton.addEventListener("click", () => {
    if (step === 0 && !answers.goal) {
      content.querySelector(".choice")?.focus();
      content.insertAdjacentHTML("beforeend", '<p class="inline-status" role="status">Choose a topic to continue.</p>');
      return;
    }
    if (step === 1) {
      const amount = Number(answers.amount);
      if (!Number.isFinite(amount) || amount < 100) {
        const input = content.querySelector("#amount-input");
        input.setCustomValidity("Enter an amount of at least ₹100.");
        input.reportValidity();
        input.addEventListener("input", () => input.setCustomValidity(""), { once: true });
        return;
      }
    }
    if (step < screens.length - 1) {
      step += 1;
      draw();
    } else if (!confirmed) {
      confirmed = true;
      draw();
    }
  });
  draw();
})();
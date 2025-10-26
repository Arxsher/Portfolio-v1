document.querySelectorAll(".portfolio-item").forEach((item) => {
  item.addEventListener("click", () => {
    item.style.transform = "translateY(-8px) scale(0.98)";
    setTimeout(() => {
      item.style.transform = "";
    }, 200);
  });
});

// Featured project interaction
document.querySelector(".featured-project").addEventListener("click", () => {
  const project = document.querySelector(".featured-project");
  project.style.transform = "translateY(-2px) scale(0.98)";
  setTimeout(() => {
    project.style.transform = "";
  }, 200);
});

// Follow button toggle
document.querySelector(".follow-btn").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  const isFollowing = btn.textContent.includes("Following");

  if (isFollowing) {
    btn.innerHTML = "<span>⭐</span><span>Github</span>";
    btn.style.background = "rgba(0, 0, 0, 0.4)";
  } else {
    btn.innerHTML = "<span>✓</span><span>Following</span>";
    btn.style.background = "rgba(76, 175, 80, 0.3)";
  }
});

// Action buttons
document.querySelectorAll(".action-icon").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.style.transform = "translateY(-2px) scale(0.9)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 150);
  });
});

// Skill tag interactions
document.querySelectorAll(".skill-tag").forEach((tag) => {
  tag.addEventListener("click", () => {
    tag.style.transform = "translateY(-3px) scale(0.95)";
    setTimeout(() => {
      tag.style.transform = "";
    }, 200);
  });
});

// Keyboard navigation
document.querySelectorAll('[tabindex="0"]').forEach((element) => {
  element.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      element.click();
    }
  });
});

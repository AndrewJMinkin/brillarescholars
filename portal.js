import { getClient } from "./auth-client.js";
const status = document.getElementById("portal-status");
const content = document.getElementById("portal-content");
const logout = document.getElementById("logout");
const list = document.getElementById("lessons");
const search = document.getElementById("lesson-search");
const category = document.getElementById("lesson-category");
let lessons = [];
let announcements = [];
const newsList = document.getElementById("announcements");
function blocked(text, href = "login.html", label = "Log In →") {
  content.hidden = true;
  logout.hidden = true;
  list.replaceChildren();
  lessons = [];
  announcements = [];
  newsList.replaceChildren();
  status.hidden = false;
  status.replaceChildren(
    document.createTextNode(text),
    document.createElement("br"),
  );
  const link = document.createElement("a");
  link.className = "btn";
  link.href = href;
  link.textContent = label;
  status.append(link);
}
function render() {
  list.replaceChildren();
  const matches = lessons.filter(
    (lesson) =>
      (category.value === "all" || lesson.category === category.value) &&
      `${lesson.title} ${lesson.description || ""}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()),
  );
  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = lessons.length
      ? "No lessons match your search. Try another word or choose all modules."
      : "Your course is being prepared. Lessons will appear here when they’re ready.";
    list.append(empty);
    return;
  }
  for (const lesson of matches) {
    const row = document.createElement("article");
    row.className = "lesson-row module-card";
    row.dataset.category = lesson.category;
    const number = document.createElement("span");
    number.className = "num module-number";
    number.textContent = String(
      lesson.position ||
        lessons
          .filter((item) => item.category === lesson.category)
          .indexOf(lesson) + 1,
    ).padStart(2, "0");
    const body = document.createElement("div");
    const tag = document.createElement("span");
    tag.className = "eyebrow";
    tag.textContent =
      lesson.category === "bonus" ? "Bonus module" : "Core program";
    const heading = document.createElement("h3");
    heading.textContent = lesson.title;
    const description = document.createElement("p");
    description.textContent = lesson.description || "";
    body.append(tag, heading, description);
    row.append(number, body);
    let safe = false;
    try {
      safe = new URL(lesson.lesson_url).protocol === "https:";
    } catch {
      /* Unassigned lessons remain disabled. */
    }
    if (safe) {
      const link = document.createElement("a");
      link.className = "btn";
      link.href = lesson.lesson_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Start lesson →";
      link.setAttribute("aria-label", `Open lesson: ${lesson.title}`);
      row.append(link);
    } else {
      const pending = document.createElement("button");
      pending.type = "button";
      pending.disabled = true;
      pending.setAttribute("aria-label", `Start lesson: ${lesson.title} — link coming soon`);
      pending.className = "btn pending lesson-placeholder";
      pending.textContent = lesson.title.startsWith("Coming Soon")
        ? "Coming soon"
        : "Start Lesson →";
      pending.title = "Lesson link coming soon";
      row.append(pending);
    }
    list.append(row);
  }
}
search.addEventListener("input", render);
category.addEventListener("change", () => {
  if (category.value !== "all") window.location.hash = category.value;
  render();
});
function showView(focus = false) {
  const view = window.location.hash.slice(1);
  const isCourse = view === "core" || view === "bonus";
  document.getElementById("portal-home").hidden = isCourse || view === "announcements";
  document.getElementById("curriculum-view").hidden = !isCourse;
  document.getElementById("announcements-view").hidden = view !== "announcements";
  if (isCourse) {
    category.value = view;
    search.value = "";
    document.getElementById("curriculum-title").textContent =
      view === "core" ? "Core Curriculum" : "Bonus Modules";
    document.getElementById("curriculum-kicker").textContent =
      view === "core" ? "01 / The foundations" : "02 / Go further";
    document.getElementById("curriculum-description").textContent =
      view === "core"
        ? "Learn the fundamentals of real estate, development, financial fundamentals in real estate, careers, and more through our flexible, self-paced curriculum."
        : "Dive deeper with optional bonus modules exploring entrepreneurship, technology, economics, and more.";
  }
  render();
  if (focus && !content.hidden) {
    const target = document.getElementById(
      isCourse
        ? "curriculum-title"
        : view === "announcements"
          ? "announcements-title"
          : "portal-home",
    );
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView?.({ block: "start" });
  }
}
window.addEventListener("hashchange", () => showView(true));
function renderAnnouncements() {
  newsList.replaceChildren();
  if (!announcements.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Check back here for news and upcoming events.";
    newsList.append(empty);
  }
  for (const news of announcements) {
    const article = document.createElement("article");
    article.className = "announcement";
    const date = document.createElement("time");
    date.dateTime = news.posted_on;
    date.textContent = new Date(
      news.posted_on + "T12:00:00Z",
    ).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    const body = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = news.title;
    const text = document.createElement("p");
    text.textContent = news.body;
    body.append(title, text);
    const destinations = {
      portal: ["/student-portal/", "Open the Student Portal →"],
      core: ["#core", "Explore core curriculum →"],
      bonus: ["#bonus", "Explore bonus modules →"],
      linkedin: ["https://www.linkedin.com/company/brillarescholars", "Brillare Scholars on LinkedIn →"],
    };
    if (Object.hasOwn(destinations, news.related_section)) {
      const link = document.createElement("a");
      link.className = "text-link";
      [link.href, link.textContent] = destinations[news.related_section];
      body.append(link);
    }
    article.append(date, body);
    newsList.append(article);
  }
}
async function init() {
  try {
    const client = await getClient();
    if (!client) {
      blocked(
        "Our new learning space is being prepared. You can continue learning in the existing student portal.",
        "https://www.brillarescholars.com/student-portal",
        "Open existing portal ↗",
      );
      const preview = document.createElement("a");
      preview.className = "text-link portal-preview-link";
      preview.href = "student-portal-preview.html";
      preview.textContent = "Preview the new Student Portal →";
      status.append(document.createElement("br"), preview);
      return;
    }
    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session))
        blocked("Please log in to view your lessons.");
    });
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) {
      window.location.replace("login.html");
      return;
    }
    const { data, error: loadError } = await client
      .from("lessons")
      .select("id,title,description,category,position,lesson_url")
      .order("position");
    if (loadError) throw loadError;
    const { data: news, error: newsError } = await client
      .from("announcements")
      .select("id,posted_on,title,body,related_section")
      .order("posted_on", { ascending: false });
    if (newsError) throw newsError;
    // This is presentation gating. Database RLS is the actual authorization boundary.
    const { data: verified } = await client.auth.getUser();
    if (!verified.user) {
      blocked("Please log in to view your lessons.");
      return;
    }
    lessons = data || [];
    announcements = news || [];
    status.hidden = true;
    content.hidden = false;
    logout.hidden = false;
    document.getElementById("welcome").textContent = user.user_metadata
      ?.first_name
      ? `Welcome back, ${user.user_metadata.first_name}. Let’s build on what you know.`
      : "Welcome back. Let’s build on what you know.";
    renderAnnouncements();
    showView();
    logout.addEventListener("click", async () => {
      logout.disabled = true;
      try {
        const { error } = await client.auth.signOut();
        if (error) throw error;
        window.location.replace("login.html");
      } catch {
        status.hidden = false;
        status.textContent = "We couldn’t log you out. Please try again.";
        logout.disabled = false;
      }
    });
  } catch {
    blocked(
      "We couldn’t load your learning space. Please try again or contact Brillare Scholars.",
      "student-portal.html",
      "Try again →",
    );
  }
}
if (document.body.dataset.portalPreview === "true") {
  const { portalPreview } = await import("./portal-preview-data.js");
  lessons = portalPreview.lessons;
  announcements = portalPreview.announcements;
  status.hidden = true;
  content.hidden = false;
  logout.hidden = true;
  renderAnnouncements();
  showView();
} else {
  init();
}

document.addEventListener("DOMContentLoaded", async () => {
  // Set the intended target or previous URL in a cookie before making the request
  document.cookie = `previousURL=${window.location.pathname}; path=/`;

  // Start authentication check but don't block UI rendering
  try {
    await Promise.all([
      checkAuth(), // Check authentication status
      loadScreenComponents(), // Load common components and handle screen-specific components
    ]);
  } catch (error) {
    console.error(
      "Error during authentication check or loading screen components:",
      error
    );
    window.location.href = "/screens/login.html";
  }
});

// Function to check authentication status
async function checkAuth() {
  try {
    const response = await fetch("/api/auth");

    if (response.redirected) {
      // If the server responds with a redirect, follow it
      window.location.href = response.url;
    } else if (!response.ok) {
      // If not authenticated or on error, handle accordingly
      throw new Error("Not authenticated");
    }
  } catch (error) {
    console.error("Error checking auth:", error);
    // Handle the case where auth check fails
    window.location.href = "/screens/login.html";
  }
}

// Function to load common components and set the active navigation item
async function loadScreenComponents() {
  await loadCommonComponents();
  const currentPath = window.location.pathname;
  const screen = getScreenFromPath(currentPath);

  const componentConfig = {
    index: [],
    profile: [],
    history: [],
    login: [],
    register: [],
  };

  const components = componentConfig[screen] || [];
  await loadUniqueComponents(components);
  setActiveNavItem();
}

async function fetchAndCacheComponent(elementId, url) {
  let cachedContent = sessionStorage.getItem(elementId);
  if (cachedContent) {
    document.getElementById(elementId).innerHTML = cachedContent;
  } else {
    try {
      const response = await fetch(url);
      const html = await response.text();
      document.getElementById(elementId).innerHTML = html;
      sessionStorage.setItem(elementId, html);
    } catch (error) {
      console.error(`Error loading component from ${url}:`, error);
    }
  }
}

async function loadCommonComponents() {
  await Promise.all([
    fetchAndCacheComponent("background", "/components/background.html"),
    fetchAndCacheComponent("footer", "/components/footer.html"),
  ]);
}

// Utility function to determine screen from the path
function getScreenFromPath(path) {
  if (path === "/" || path === "/index.html") return "index";
  if (path.includes("profile")) return "profile";
  if (path.includes("history")) return "history";
  if (path.includes("login")) return "login";
  if (path.includes("register")) return "register";
  return "index"; // Default screen
}

async function loadUniqueComponents(components) {
  for (const { elementId, componentPath } of components) {
    const element = document.getElementById(elementId);
    if (element) {
      try {
        const response = await fetch(componentPath);
        const html = await response.text();
        element.innerHTML = html;
      } catch (error) {
        console.error(`Error loading component from ${componentPath}:`, error);
      }
    }
  }
}
function setActiveNavItem() {
  const currentPath = window.location.pathname;
  const normalizedPath = currentPath === "/" ? "/index.html" : currentPath;
  const navItems = document.querySelectorAll("nav li");

  navItems.forEach((item) => {
    const link = item.querySelector("a");
    const linkPath = new URL(link.href).pathname; // Extract path from link href

    // Match the path precisely or use a more specific segment
    if (normalizedPath === linkPath || normalizedPath.includes(linkPath)) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

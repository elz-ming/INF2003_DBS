document.addEventListener("DOMContentLoaded", () => {
  // Modular function to load multiple components based on a config
  async function loadComponents(components) {
    for (const { elementId, componentPath } of components) {
      const element = document.getElementById(elementId);
      if (element) {
        try {
          const response = await fetch(componentPath);
          const html = await response.text();
          element.innerHTML = html;
        } catch (error) {
          console.error(
            `Error loading component from ${componentPath}:`,
            error
          );
        }
      }
    }
  }

  // Define component configurations for different screens
  const componentConfig = {
    index: [
      { elementId: "background", componentPath: "/components/background.html" },
    ],
    login: [
      { elementId: "background", componentPath: "/components/background.html" },
    ],
    // Add more screen configurations as needed
  };

  // Function to load components for the current screen based on the path
  function loadScreenComponents(screen) {
    const components = componentConfig[screen] || [];
    loadComponents(components);
  }

  // Determine the screen based on the current path and use a switch statement
  const currentPath = window.location.pathname;

  switch (true) {
    case currentPath == "/":
      loadScreenComponents("index");
      break;
    case currentPath.includes("login"):
      loadScreenComponents("login");
      break;
    default:
      loadScreenComponents("index"); // Fallback to home or a default screen
      break;
  }
});

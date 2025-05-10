import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Add global error handler for debugging
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global error caught:", {
    message,
    source,
    lineno,
    colno,
    error,
  });

  // Add visible error message for debugging in production
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const errorDiv = document.createElement("div");
    errorDiv.style.backgroundColor = "#ffebee";
    errorDiv.style.color = "#b71c1c";
    errorDiv.style.padding = "20px";
    errorDiv.style.margin = "20px";
    errorDiv.style.borderRadius = "5px";
    errorDiv.style.fontFamily = "sans-serif";

    errorDiv.innerHTML = `
      <h2>Application Error</h2>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Source:</strong> ${source}</p>
      <p><strong>Line:</strong> ${lineno}, <strong>Column:</strong> ${colno}</p>
      <p><strong>Stack:</strong> ${
        error?.stack
          ? error.stack.replace(/\\n/g, "<br>")
          : "No stack available"
      }</p>
      <p><a href="/debug.html" style="color: blue;">Go to Debug Page</a></p>
    `;

    rootElement.appendChild(errorDiv);
  }

  return false; // Let the error propagate
};

// Check if we're running in production (Netlify)
const isProduction =
  window.location.hostname.includes("netlify") ||
  window.location.hostname.includes("gudangmitra");

// Log environment information
console.log("Environment:", {
  isProduction,
  hostname: window.location.hostname,
  pathname: window.location.pathname,
  protocol: window.location.protocol,
  apiEndpoint: isProduction ? "/.netlify/functions" : "/api",
});

// Get the root element
const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("React app rendered successfully");
  } catch (error) {
    console.error("Error rendering React app:", error);

    // Show error in the UI
    rootElement.innerHTML = `
      <div style="padding: 20px; background-color: #ffebee; color: #b71c1c; font-family: sans-serif;">
        <h2>Failed to load application</h2>
        <p>${error instanceof Error ? error.message : "Unknown error"}</p>
        <p><a href="/debug.html" style="color: blue;">Go to Debug Page</a></p>
      </div>
    `;
  }
} else {
  console.error("Root element not found");

  // Create a root element if it doesn't exist
  const newRoot = document.createElement("div");
  newRoot.id = "root";
  document.body.appendChild(newRoot);

  // Try rendering again
  try {
    const root = createRoot(newRoot);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("React app rendered in newly created root");
  } catch (error) {
    console.error("Error rendering React app in newly created root:", error);

    // Show error in the UI
    newRoot.innerHTML = `
      <div style="padding: 20px; background-color: #ffebee; color: #b71c1c; font-family: sans-serif;">
        <h2>Failed to load application</h2>
        <p>${error instanceof Error ? error.message : "Unknown error"}</p>
        <p><a href="/debug.html" style="color: blue;">Go to Debug Page</a></p>
      </div>
    `;
  }
}

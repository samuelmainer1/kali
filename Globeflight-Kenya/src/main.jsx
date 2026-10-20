import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import "./index.css";
import LoaderOnPageMount from "./components/LoaderOnPgeMount.jsx";
import "@/lib/leafletIconFix"

const AppContainer = () => {
  const [contentRendered, setContentRendered] = useState(false);

  useEffect(() => {
    const asyncCall = () => {
      return new Promise((resolve) => setTimeout(resolve, 2500));
    };

    asyncCall().then(() => {
      setContentRendered(true);
      removeLoader();  // Call to remove loader
    });
  }, []);

  // Define removeLoader to hide/remove the loader element
  const removeLoader = () => {
    const loaderElement = document.getElementById("loader");
    if (loaderElement) {
      loaderElement.style.display = "none";  // Hide the loader
    }
  };

  return (
    <HelmetProvider>
      {contentRendered ? <App /> : <LoaderOnPageMount />}
    </HelmetProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>
);
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@fontsource/roboto/500.css";
import App from "./App";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import { Toaster } from "./components/ui/toaster";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
    <Toaster />
  </Provider>
);

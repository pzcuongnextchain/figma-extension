import {
  createTheme,
  css,
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
} from "@mui/material";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { CodeExplorer } from "../pages/CodeExplorer";
import App from "./App";

const theme = createTheme();
const globalStyles = css``;

const root = createRoot(document.getElementById("root")!);

const isFigma = window.parent !== window;

root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <GlobalStyles styles={globalStyles} />
    {isFigma ? (
      <App />
    ) : (
      <BrowserRouter>
        <Routes>
          <Route path="/code-explorer" element={<CodeExplorer />} />
        </Routes>
      </BrowserRouter>
    )}
  </ThemeProvider>,
);

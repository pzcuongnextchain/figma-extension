export const openCodeExplorer = (data: any) => {
  const url = new URL(window.location.href);
  url.pathname = "/";
  const dataToPass = Array.isArray(data) ? data : [];
  window.open(
    "http://localhost:5173/code-explorer?data=" + JSON.stringify(dataToPass),
    "_blank",
  );
};

import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
function App() {
  const [f, setF] = useState({ line1: "", town: "", postcode: "" });
  const on = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  useEffect(() => {
    window.Postio.AddressFinder.setup({ apiKey: window.KEY, baseUrl: "https://stage-api.postio.co.uk/v1",
      input: "#c-line1", output: { address_line_1: "#c-line1", post_town: "#c-town", postcode: "#c-pc" } });
  }, []);
  return (<div>
    <input id="c-line1" value={f.line1} onChange={on("line1")} />
    <input id="c-town" value={f.town} onChange={on("town")} />
    <input id="c-pc" value={f.postcode} onChange={on("postcode")} />
    <pre id="c-state">{JSON.stringify(f)}</pre></div>);
}
createRoot(document.getElementById("root")).render(<App />);

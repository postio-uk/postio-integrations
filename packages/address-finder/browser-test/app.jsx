import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { PostioProvider, AddressFinder } from "@postio/react";

function App() {
  const [f, setF] = useState({ line1: "", town: "", postcode: "" });
  const [picked, setPicked] = useState(null);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <PostioProvider apiKey={window.KEY} baseUrl="https://stage-api.postio.co.uk/v1">
      <AddressFinder id="rpkg-search" clientId="react-test/1" onSelect={(a) => setPicked(a.udprn)}
        output={{ address_line_1: "#r-line1", post_town: "#r-town", postcode: "#r-pc" }} />
      <input id="r-line1" value={f.line1} onChange={on("line1")} />
      <input id="r-town" value={f.town} onChange={on("town")} />
      <input id="r-pc" value={f.postcode} onChange={on("postcode")} />
      <pre id="r-state">{JSON.stringify({ ...f, picked })}</pre>
    </PostioProvider>
  );
}
createRoot(document.getElementById("root")).render(<App />);

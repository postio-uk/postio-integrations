// Entry for the <script> tag bundle. Mounts setup() under
// `window.Postio.AddressFinder.setup` so consumers can do:
//   <script src="https://cdn.postio.co.uk/v1/address-finder.js"></script>
//   <script>Postio.AddressFinder.setup({ apiKey, input, bind })</script>
import { setup } from "@postio/address-finder";

declare global {
  interface Window {
    Postio?: { AddressFinder?: { setup: typeof setup } } & Record<string, unknown>;
  }
}

const root = (window.Postio = window.Postio ?? {});
root.AddressFinder = { setup };

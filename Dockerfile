# Container for the Postio MCP server.
#
# Exists so automated MCP directories (Glama and friends) can start the
# server and enumerate its tools. Introspection runs without credentials —
# the server advertises its tools with no key and fails per-call instead —
# so no build arg or secret is needed to evaluate it.
#
# For real use, pass your key through:
#   docker run -e POSTIO_API_KEY=pk_… postio/mcp
# Get a free key at https://postio.co.uk/signup
FROM node:22-alpine

# Install from the registry rather than building the monorepo: the published
# artefact is what users actually run, so this container tests the real thing.
RUN npm install -g @postio/mcp@latest

ENTRYPOINT ["postio-mcp"]

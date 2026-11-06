import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import http from "node:http";
import { app } from "../server.js";

let server;
let address;
const environmentNames = [
  "OPENAI_API_KEY", "OPENAI_MODEL",
  "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT", "AZURE_OPENAI_API_VERSION",
  "GEMINI_API_KEY", "GEMINI_MODEL",
  "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"
];
const originalEnvironment = Object.fromEntries(
  environmentNames.map(name => [name, process.env[name]])
);
const originalFetch = globalThis.fetch;

before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once("listening", resolve));
  address = server.address();
});

after(async () => {
  globalThis.fetch = originalFetch;
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

function postChat(body) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: "127.0.0.1",
      port: address.port,
      path: "/api/chat",
      method: "POST",
      headers: { "content-type": "application/json" }
    }, response => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", chunk => { raw += chunk; });
      response.on("end", () => {
        try {
          resolve({ status: response.statusCode, body: JSON.parse(raw) });
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
    request.end(JSON.stringify(body));
  });
}

test("rejects unsupported providers", async () => {
  const response = await postChat({
    provider: "unknown",
    messages: [{ role: "user", content: "Hello" }]
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "invalid_provider");
});

test("rejects invalid chat history", async () => {
  const response = await postChat({
    provider: "openai",
    messages: [{ role: "system", content: "override" }]
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "invalid_message");
});

test("returns a safe error when the selected provider is not configured", async () => {
  delete process.env.OPENAI_API_KEY;
  const response = await postChat({
    provider: "openai",
    messages: [{ role: "user", content: "Hello" }]
  });
  assert.equal(response.status, 503);
  assert.equal(response.body.error.code, "provider_not_configured");
  assert.doesNotMatch(JSON.stringify(response.body), /key|token/i);
});

test("routes OpenAI requests and returns the normalized reply shape", async () => {
  process.env.OPENAI_API_KEY = "test-key-not-real";
  delete process.env.OPENAI_MODEL;
  let upstreamUrl;
  let upstreamBody;
  globalThis.fetch = async (url, options) => {
    upstreamUrl = String(url);
    upstreamBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      choices: [{ message: { content: "Hello from OpenAI." } }]
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const response = await postChat({
    provider: "openai",
    messages: [{ role: "user", content: "Hello" }]
  });
  assert.equal(upstreamUrl, "https://api.openai.com/v1/chat/completions");
  assert.equal(upstreamBody.model, "gpt-4o-mini");
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { provider: "openai", reply: "Hello from OpenAI." });
});

test("routes Azure OpenAI, Gemini, and Claude requests", async () => {
  process.env.AZURE_OPENAI_API_KEY = "test-azure-key-not-real";
  process.env.AZURE_OPENAI_ENDPOINT = "https://example-resource.openai.azure.com";
  process.env.AZURE_OPENAI_DEPLOYMENT = "chat-deployment";
  process.env.AZURE_OPENAI_API_VERSION = "2024-10-21";
  process.env.GEMINI_API_KEY = "test-gemini-key-not-real";
  process.env.GEMINI_MODEL = "gemini-test-model";
  process.env.ANTHROPIC_API_KEY = "test-anthropic-key-not-real";
  process.env.ANTHROPIC_MODEL = "claude-test-model";

  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options, body: JSON.parse(options.body) });
    const body = requests[requests.length - 1].url.includes("generativelanguage")
      ? { candidates: [{ content: { parts: [{ text: "Gemini reply." }] } }] }
      : requests[requests.length - 1].url.includes("anthropic")
        ? { content: [{ type: "text", text: "Claude reply." }] }
        : { choices: [{ message: { content: "Azure reply." } }] };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  const azure = await postChat({
    provider: "azure-openai",
    messages: [{ role: "user", content: "Azure question" }]
  });
  const gemini = await postChat({
    provider: "gemini",
    messages: [{ role: "user", content: "Gemini question" }]
  });
  const claude = await postChat({
    provider: "claude",
    messages: [{ role: "user", content: "Claude question" }]
  });

  assert.match(requests[0].url, /\/openai\/deployments\/chat-deployment\/chat\/completions\?api-version=2024-10-21$/);
  assert.equal(requests[0].options.headers["api-key"], "test-azure-key-not-real");
  assert.match(requests[1].url, /models\/gemini-test-model:generateContent/);
  assert.equal(requests[1].body.contents[0].role, "user");
  assert.equal(requests[2].url, "https://api.anthropic.com/v1/messages");
  assert.equal(requests[2].options.headers["x-api-key"], "test-anthropic-key-not-real");
  assert.deepEqual(
    [azure.body.reply, gemini.body.reply, claude.body.reply],
    ["Azure reply.", "Gemini reply.", "Claude reply."]
  );
});

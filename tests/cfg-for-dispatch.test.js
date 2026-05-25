import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildCfgForDispatch } from "../wecom/cfg-for-dispatch.js";

describe("buildCfgForDispatch", () => {
  it("appends 'message' to both top-level and sandbox tools.deny", () => {
    const out = buildCfgForDispatch({});
    assert.deepEqual(out.tools.deny, ["message"]);
    assert.deepEqual(out.tools.sandbox.tools.deny, ["message"]);
  });

  it("preserves and deduplicates existing deny entries", () => {
    const cfg = {
      tools: {
        deny: ["foo", "message"],
        sandbox: { tools: { deny: ["bar"] } },
      },
    };
    const out = buildCfgForDispatch(cfg);
    assert.deepEqual(out.tools.deny, ["foo", "message"]);
    assert.deepEqual(out.tools.sandbox.tools.deny, ["bar", "message"]);
  });

  it("keeps other config fields intact", () => {
    const cfg = {
      agents: { defaults: { workspace: "/data/openclaw/workspace" } },
      plugins: { allow: ["wecom"] },
      tools: { allow: ["sandbox_exec"] },
    };
    const out = buildCfgForDispatch(cfg);
    assert.deepEqual(out.agents, cfg.agents);
    assert.deepEqual(out.plugins, cfg.plugins);
    assert.deepEqual(out.tools.allow, ["sandbox_exec"]);
    assert.deepEqual(out.tools.deny, ["message"]);
  });

  it("does not mutate the input config", () => {
    const cfg = { tools: { deny: ["foo"], sandbox: { tools: { deny: ["bar"] } } } };
    const before = JSON.parse(JSON.stringify(cfg));
    buildCfgForDispatch(cfg);
    assert.deepEqual(cfg, before);
  });
});

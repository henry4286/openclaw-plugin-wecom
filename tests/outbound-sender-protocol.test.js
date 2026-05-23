import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyOutboundSenderProtocol,
  ensureOutboundSenderProtocol,
  prepareWecomMessageToolParams,
  resolveOutboundSenderLabel,
} from "../wecom/outbound-sender-protocol.js";

describe("outbound sender protocol", () => {
  it("leaves normal content unchanged", () => {
    assert.deepEqual(applyOutboundSenderProtocol("你好"), {
      sender: "",
      content: "你好",
      usedProtocol: false,
    });
  });

  it("converts sender protocol to visible inline prefix", () => {
    assert.deepEqual(applyOutboundSenderProtocol("[[sender:alice]]\n你好"), {
      sender: "alice",
      content: "【sender:alice】你好",
      usedProtocol: true,
    });
  });

  it("keeps multiline bodies readable", () => {
    assert.deepEqual(applyOutboundSenderProtocol("[[sender:alice]]\n第一行\n第二行"), {
      sender: "alice",
      content: "【sender:alice】\n第一行\n第二行",
      usedProtocol: true,
    });
  });

  it("adds a protocol header when missing", () => {
    assert.equal(ensureOutboundSenderProtocol("你好", "alice"), "[[sender:alice]]\n你好");
  });
});

describe("resolveOutboundSenderLabel", () => {
  it("uses dm peer ids for dynamic dm agents", () => {
    assert.equal(resolveOutboundSenderLabel("wecom-dm-alice"), "alice");
    assert.equal(resolveOutboundSenderLabel("wecom-sales-dm-alice"), "alice");
  });

  it("uses explicit group labels for dynamic group agents", () => {
    assert.equal(resolveOutboundSenderLabel("wecom-group-wr123"), "group:wr123");
    assert.equal(resolveOutboundSenderLabel("wecom-sales-group-wr123"), "group:wr123");
  });

  it("falls back to normalized plain agent ids", () => {
    assert.equal(resolveOutboundSenderLabel("main"), "main");
    assert.equal(resolveOutboundSenderLabel(""), "main");
  });
});

describe("prepareWecomMessageToolParams", () => {
  it("injects sender protocol for cross-chat wecom sends from dynamic dm agents", () => {
    assert.deepEqual(
      prepareWecomMessageToolParams(
        {
          action: "send",
          channel: "wecom",
          target: "韦元栋",
          message: "你好",
        },
        "wecom-dm-alice",
      ),
      {
        action: "send",
        channel: "wecom",
        target: "韦元栋",
        message: "[[sender:alice]]\n你好",
      },
    );
  });

  it("does not inject for same-chat dm targets", () => {
    const params = {
      action: "send",
      channel: "wecom",
      target: "alice",
      message: "你好",
    };
    assert.equal(prepareWecomMessageToolParams(params, "wecom-dm-alice"), params);
  });

  it("does not inject for non-dynamic agents", () => {
    const params = {
      action: "send",
      channel: "wecom",
      target: "weiyuandong",
      message: "你好",
    };
    assert.equal(prepareWecomMessageToolParams(params, "main"), params);
  });
});

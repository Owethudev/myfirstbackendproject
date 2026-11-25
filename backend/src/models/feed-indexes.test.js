import assert from "node:assert/strict";
import test from "node:test";
import { EventPost } from "./eventpost.model.js";
import { Post } from "./post.model.js";

const getIndexKeys = (model) => model.schema.indexes().map(([keys]) => keys);

test("post indexes support newest-first feed and reported-post queries", () => {
  const indexes = getIndexKeys(Post);

  assert.ok(indexes.some((keys) => keys.createdAt === -1));
  assert.ok(indexes.some((keys) => keys.reported === 1 && keys.createdAt === -1));
});

test("event index supports newest-first feed queries", () => {
  assert.ok(getIndexKeys(EventPost).some((keys) => keys.createdAt === -1));
});

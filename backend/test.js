const test = require("node:test");
const assert = require("node:assert");

test("SaaSify CRM API basic test", async () => {
    const response = await fetch("http://localhost:5000/api/health");

    assert.strictEqual(response.status, 200);

    const data = await response.json();

    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, "SaaSify CRM API is running");
});
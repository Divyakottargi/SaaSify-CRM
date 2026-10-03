const { describe, it } = require("node:test");
const assert = require("node:assert");

describe("Email Integration", () => {

    it("should require authentication", async () => {

        const response = await fetch(
            "http://localhost:10000/api/emails/send",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    to: "test@example.com",
                    subject: "Test Email",
                    text: "Integration test"
                })
            }
        );

        assert.strictEqual(response.status, 401);
    });

});
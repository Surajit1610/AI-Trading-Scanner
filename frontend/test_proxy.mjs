import { createAuthClient } from "better-auth/client";
const client = createAuthClient({ baseURL: "http://localhost:3000" });

async function test() {
  const res = await client.resetPassword({ newPassword: "newpassword123", token: "dummy-token" });
  console.log("resetPassword:", res);
}
test();

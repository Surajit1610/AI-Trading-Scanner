import { createAuthClient } from "better-auth/client";
const client = createAuthClient();
console.log(Object.keys(client));
console.log(Object.keys(client).filter(k => k.toLowerCase().includes('password')));

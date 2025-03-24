import { expectType } from "tsd";
import $ from "..";

/* basic */

const promise = $("curl https://www.youtube.com/watch?v=6xKWiCMKKJg");

// at this point it's a child_process instance
promise.kill();
promise.ref();
promise.unref();

const result = await promise;

// after that stdout/stderr are available as string values

console.log(result.stdout);
console.log(result.stderr);

console.log(result.connected);
console.log(result.signalCode);
console.log(result.exitCode);
console.log(result.killed);
console.log(result.spawnfile);
console.log(result.spawnargs);
console.log(result.pid);
console.log(result.stdin);
console.log(result.stdout);
console.log(result.stderr);
console.log(result.stdin);

/* json */

const json = await $.json("curl https://geolocation.microlink.io");
expectType<unknown>(json.stdout);

type Geolocation = {
  ip: {
    address: string;
  };
};

// Explicit type
const json2 = await $.json<Geolocation>("curl https://geolocation.microlink.io");
expectType<Geolocation>(json2.stdout);

// Override json=true option
const json3 = await $.json("curl https://geolocation.microlink.io", { json: false });
expectType<string>(json3.stdout);

// When json option might be true or false
const json4 = await $("curl https://geolocation.microlink.io", { json: {} as boolean });
expectType<unknown>(json4.stdout);

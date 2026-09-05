import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const corpus = readFileSync(
  new URL("../data/quran-uthmani.txt", import.meta.url),
);
const expected =
  "7f30c647331a61100ebf24a80507dc0fcdd9f2df97f1312b5b2dfcb982a7f326";
if (createHash("sha256").update(corpus).digest("hex") !== expected)
  throw new Error(
    "Quran corpus checksum mismatch. Restore the verified source; do not change the checksum.",
  );
const verse = corpus
  .toString("utf8")
  .split("\n")
  .find((line) => line.startsWith("3|135|"))
  ?.split("|")[2];
if (!verse) throw new Error("Missing verse 3:135");
writeFileSync(
  new URL("../src/ayah.json", import.meta.url),
  JSON.stringify(
    { text: verse, source: "https://tanzil.net/#3:135" },
    null,
    2,
  ) + "\n",
);

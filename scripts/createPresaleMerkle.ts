const { readFile } = require("fs");
const { MerkleTree } = require("merkletreejs");
const SHA256 = require("crypto-js/sha256");

async function main() {
  // Read addresses approved for the presale
  readFile("data/presale.csv", "utf8", (err, data) => {
    if (err) throw err;

    // Converts file's contents into an array
    const addresses = data.split("\n");
    console.log("addresses", addresses);

    const leaves = addresses.map((address) => {
      return SHA256(address);
    });
    console.log("leaves", leaves);

    const tree = new MerkleTree(leaves, SHA256);
    console.log("tree", tree);

    const root = tree.getRoot().toString("hex");
    console.log("root", root);

    const leaf = SHA256(addresses[0]);
    console.log("leaf", leaf);

    const proof = tree.getProof(leaf);
    console.log("proof", proof);

    console.log("tree verified:", tree.verify(proof, leaf, root));
    console.log("tree string", tree.toString());
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const hre = require("hardhat");

async function main() {
    const contractAddress = "0xd8540A08f770BAA3b66C4d43728CDBDd1d7A9c3b";

    console.log("Checking contract at:", contractAddress);
    console.log("Network:", hre.network.name);

    // Get the code at the address
    const code = await hre.ethers.provider.getCode(contractAddress);

    if (code === "0x") {
        console.log("\n❌ CONTRACT NOT DEPLOYED");
        console.log("The address has no contract code.");
        console.log("\nYou need to deploy the contract first using:");
        console.log("npx hardhat run scripts/deploy.js --network fuji");
    } else {
        console.log("\n✅ CONTRACT IS DEPLOYED!");
        console.log("Contract code length:", code.length, "bytes");
        console.log("\nYou can verify it on Snowtrace:");
        console.log(`https://testnet.snowtrace.io/address/${contractAddress}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

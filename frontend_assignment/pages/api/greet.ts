import Greeter from "artifacts/contracts/Greeters.sol/Greeters.json"
import { Contract, providers, utils } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"
import { CONTRACT } from "../../consts";

// This API can represent a backend.
// The contract owner is the only account that can call the `greet` function,
// However they will not be aware of the identity of the users generating the proofs.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { greeting, nullifierHash, solidityProof } = JSON.parse(req.body)

    const contract = new Contract(CONTRACT, Greeter.abi)
    const provider = new providers.JsonRpcProvider("http://localhost:8545")

    const contractOwner = contract.connect(provider.getSigner())

    try {
        await contractOwner.greet(utils.formatBytes32String(greeting), nullifierHash, solidityProof)

        res.status(200).end()
    } catch (error: any) {
        const { message } = JSON.parse(error.body).error
        const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))

        res.status(500).send(reason || "Unknown error!")
    }
}

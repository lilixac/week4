import detectEthereumProvider from "@metamask/detect-provider"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { providers, Contract, utils } from "ethers"
import Head from "next/head"
import React from "react"
import Greeter from "../artifacts/contracts/Greeters.sol/Greeters.json";
import { Formik } from "formik"
import { object, string, number } from 'yup';
import { Form, Button, Col } from 'react-bootstrap'

import { CONTRACT } from "../consts";
import styles from "../styles/Home.module.css"

// schema for form validation
const schema = object().shape({
    userName: string().required().min(3),
    age: number().required().positive(),
    address: string().required().min(3),
});

export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet and greet!")
    const [greeting, setGreeting] = React.useState("")

    React.useEffect(() => {
        async function fetchData() {
            const provider = new providers.JsonRpcProvider('http://localhost:8545')
            const contract = new Contract(
                CONTRACT,
                Greeter.abi,
                provider
            )

            contract.on('NewGreeting', (greet) => {
                const message = utils.parseBytes32String(greet);
                setGreeting(message);
            });
        }
        fetchData()
    }, []);



    async function greet() {
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Sign this message to create your identity!")

        const identity = new ZkIdentity(Strategy.MESSAGE, message)
        const identityCommitment = identity.genIdentityCommitment()
        const identityCommitments = await (await fetch("./identityCommitments.json")).json()

        const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

        setLogs("Creating your Semaphore proof...")

        const greeting = "Hello world"

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            merkleProof.root,
            greeting
        )

        const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/greet", {
            method: "POST",
            body: JSON.stringify({
                greeting,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()

            setLogs(errorMessage)
        } else {
            setLogs("Your anonymous greeting is onchain :)")
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Greetings</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Formik
                validationSchema={schema}
                onSubmit={(values) => {
                    console.log(JSON.stringify(values))
                }}
                initialValues={{
                    userName: '',
                    age: '',
                    address: '',
                }}
            >
                {({
                    handleSubmit,
                    handleChange,
                    values,
                    touched,
                    errors,
                    isValid
                }) => (
                    <Form noValidate onSubmit={handleSubmit}>
                        <Form.Group
                            as={Col}
                            md="3"
                            controlId="validationFormik101"
                            className="position-relative"
                        >
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="userName"
                                value={values.userName}
                                onChange={handleChange}
                                isInvalid={!!errors.userName && touched.userName}
                            />

                            <Form.Control.Feedback type="invalid" tooltip>
                                {errors.userName}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group
                            as={Col}
                            md="3"
                            controlId="validationFormik102"
                            className="position-relative"
                        >
                            <Form.Label>Age</Form.Label>
                            <Form.Control
                                type="number"
                                name="age"
                                value={values.age}
                                onChange={handleChange}
                                isInvalid={!!errors.age && touched.age}
                            />
                            <Form.Control.Feedback type="invalid" tooltip>
                                {errors.age}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group
                            as={Col}
                            md="3"
                            controlId="validationFormik103"
                            className="position-relative"
                        >
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                name="address"
                                value={values.address}
                                onChange={handleChange}
                                isInvalid={!!errors.address && touched.address}
                            />

                            <Form.Control.Feedback type="invalid" tooltip>
                                {errors.address}
                            </Form.Control.Feedback>
                        </Form.Group>
                        <br />
                        <Button type="submit">Submit</Button>
                    </Form>
                )}
            </Formik>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>
            <br/>

            <main className={styles.main}>
                <h1 className={styles.title}>Greetings</h1>

                <p className={styles.description}>A simple Next.js/Hardhat privacy application with Semaphore.</p>

                <div className={styles.logs}>{logs}</div>

                {greeting ? <div className={styles.logs}>{greeting}</div>:null}

                <div onClick={() => greet()} className={styles.button}>
                    Greet
                </div>
            </main>
        </div>
    )
}

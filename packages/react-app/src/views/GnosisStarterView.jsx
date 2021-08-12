import Safe, { EthersAdapter } from "@gnosis.pm/safe-core-sdk";
import { Button, Divider, Input, Statistic } from "antd";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { EtherInput } from "../components";
import { useBalance } from "../hooks";

export default function GnosisStarterView({
  purpose,
  userSigner, // injectedProvider == MetaMask
  address,
  mainnetProvider,
  localProvider, // hardhat
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
  DEBUG,
}) {
  const [to, setTo] = useState("");
  const [value, setValue] = useState(0);
  const [selector, setSelector] = useState("");
  const [params, setParams] = useState([]);
  const [data, setData] = useState("0x0000000000000000000000000000000000000000");
  const [userSignerAddress, setUserSignerAddress] = useState("");
  const [localProviderAddress, setLocalProviderAddress] = useState("");

  const [safeSdk, setSafeSdk] = useState();
  const [safeOwners, setSafeOwners] = useState("");
  const [safeThreshold, setSafeThreshold] = useState("");

  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [newThreshold, setNewThreshold] = useState("");

  const [ethToSend, setEthToSend] = useState(0);

  let safeAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // default "GnosisSafe Contract" address
  let safeBalance = useBalance(localProvider, safeAddress);
  let safeBalanceEth = safeBalance ? ethers.utils.formatEther(safeBalance) : "...";

  const signerLocalProvider = localProvider.getSigner();

  useEffect(() => {
    createSafe();
  }, [address]);

  useEffect(() => {
    getOwners();
    getThreshold();
  }, [safeSdk]);

  useEffect(() => {
    getUserSignerAddress();
  }, [userSigner]);

  useEffect(() => {
    getLocalProviderAddress();
  }, [localProvider]);

  // check address of signer1 (same as Deployer): 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  async function getLocalProviderAddress() {
    if (signerLocalProvider) {
      setLocalProviderAddress(await signerLocalProvider.getAddress());
    }
  }

  async function getUserSignerAddress() {
    if (userSigner) {
      setUserSignerAddress(await userSigner.getAddress());
    }
  }

  if (DEBUG) {
    console.log("localProviderAddress: ", localProviderAddress);
    console.log("userSignerAddress: ", userSignerAddress);
  }

  const ethAdapter = new EthersAdapter({ ethers, signer: signerLocalProvider });

  async function createSafe() {
    const id = await ethAdapter.getChainId();
    const contractNetworks = {
      [id]: {
        multiSendAddress: safeAddress,
        safeMasterCopyAddress: safeAddress,
        safeProxyFactoryAddress: safeAddress,
      },
    };
    // const contract = await ethAdapter.getSafeContract(safeAddress);
    // console.log(contract);

    /*
     Create a safe from safeFactory
    */
    // const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks });
    // const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks });
    // console.log("address: ", address);
    // const owners = [address];
    // const threshold = 1;
    // const safeAccountConfig = {
    //   owners,
    //   threshold,
    // to: "0x0000000000000000000000000000000000000000",
    // data: "0x",
    // fallbackHandler: "0x0000000000000000000000000000000000000000",
    // paymentToken: "0x0000000000000000000000000000000000000000",
    // payment: 0,
    // paymentReceiver: "0x0000000000000000000000000000000000000000",
    // };
    // const safeSdk = await safeFactory.deploySafe(safeAccountConfig);
    // safeAddress = safeSdk.getAddress();

    /*
     Creates a safe from deployed Safe
    */
    const safeSdk = await Safe.create({ ethAdapter, safeAddress, contractNetworks });
    setSafeSdk(safeSdk);
  }

  async function executeTransaction() {
    /*
      Create a Safe Transaction
    */
    if (to) {
      const partialTx = {
        to,
        data,
        value: value.toString(),
      };
      console.log("partialTx: ", partialTx);
      const safeTransaction = await safeSdk.createTransaction(partialTx);
      console.log("safeTransaction: ", safeTransaction);

      /*
        Off-chain signature
      */
      const signer1Signature = await safeSdk.signTransaction(safeTransaction);
      console.log("signer1Signature: ", signer1Signature);

      /*
        Transaction execution
      */
      const safeSdk3 = await safeSdk.connect({ ethAdapter, safeAddress });
      const execOptions = { gasLimit: 150000, gas: 45280, safeTxGas: 45280 };
      const executeTxResponse = await safeSdk3.executeTransaction(safeTransaction, execOptions);
      const receipt = executeTxResponse.transactionResponse && (await executeTxResponse.transactionResponse.wait());
      console.log("receipt: ", receipt);
    }
  }

  async function addOwner() {
    if (safeSdk) {
      const ethAdapterOwner2 = new EthersAdapter({ ethers, signer: signerLocalProvider });
      const safeSdk2 = await safeSdk.connect({ ethAdapter: ethAdapterOwner2, safeAddress });

      let safeTransaction;
      try {
        safeTransaction = await safeSdk.getAddOwnerTx(newOwnerAddress);
      } catch (e) {
        console.log("getAddOwnerTx Error: ", e);
        return;
      }

      console.log("safeTransaction: ", safeTransaction);
      const txResponse = await safeSdk.executeTransaction(safeTransaction);
      console.log(txResponse);
      // await txResponse.wait();

      const txHash = await safeSdk2.getTransactionHash(safeTransaction);
      const approveTxResponse = await safeSdk2.approveTransactionHash(txHash);
      // await approveTxResponse.wait();

      getOwners();
      getThreshold();
    }
  }

  async function removeOwner() {
    if (safeSdk) {
      try {
        console.log("newThreshold: ", newThreshold);
        const safeTransaction = await safeSdk.getRemoveOwnerTx(newOwnerAddress, newThreshold);
        const txResponse = await safeSdk.executeTransaction(safeTransaction);
        // await txResponse.wait()

        getOwners();
        getThreshold();
      } catch (e) {
        console.log("getRemoveOwnerTx Error: ", e);
        return;
      }
    }
  }

  async function getOwners() {
    if (safeSdk) {
      const owners = await safeSdk.getOwners();
      setSafeOwners(owners.join("\r\n"));
    }
  }

  async function getThreshold() {
    if (safeSdk) {
      const threshold = await safeSdk.getThreshold();
      setSafeThreshold(threshold);
    }
  }

  async function sendEtherToSafe() {
    console.log("sendEther()");
    console.log("signer.address: ", await signerLocalProvider.getAddress());
    console.log("userSigner: ", await userSigner.getAddress());
    await userSigner.sendTransaction({
      to: safeAddress,
      value: ethers.utils.parseEther(ethToSend),
    });
  }

  return (
    <div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 600, margin: "auto", marginTop: 64 }}>
        <h2>Safe</h2>
        <div>
          <Statistic title="Safe Address" value={safeAddress} />
        </div>
        <div>
          <Statistic title="Safe Balance (ETH)" value={safeBalanceEth} />
        </div>
        <div>
          <Statistic title="Owners" value={safeOwners} />
        </div>
        <div>
          <Statistic title="Threshold" value={safeThreshold} />
        </div>
      </div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Owners Management</h2>
        <Input
          placeholder="Address"
          onChange={async e => {
            setNewOwnerAddress(e.target.value);
          }}
        />
        <Input
          placeholder="New Threshold"
          onChange={async e => {
            setNewThreshold(e.target.value);
          }}
        />
        {/* <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              createSafe();
            }}
          >
            Create Safe
          </Button> */}
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            addOwner();
          }}
        >
          Add
        </Button>
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            removeOwner();
          }}
        >
          Remove
        </Button>
        {/* <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            getOwners();
          }}
        >
          Get Owners
        </Button> */}
      </div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Send ETH to Safe</h2>
        <Input
          placeholder="Amount of ETH (e.g. 1)"
          onChange={async e => {
            setEthToSend(e.target.value);
          }}
        />
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            sendEtherToSafe();
          }}
        >
          Send
        </Button>
      </div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Gnosis Transaction Execution</h2>
        <h5>Enter Selector and Params only if the to address is a contract address</h5>
        <Divider />
        <div style={{ margin: 8 }}>
          <Input
            placeholder="Enter To Address"
            onChange={async e => {
              setTo(e.target.value);
            }}
          />
          <EtherInput
            autofocus
            price={price}
            placeholder="Enter Tx Value"
            onChange={value => {
              value = ethers.utils.parseEther(value.toString());
              setValue(value);
            }}
          />

          <Input
            placeholder="Enter Selector i.e add(uint, uint)"
            onChange={async e => {
              setSelector(e.target.value);
            }}
          />

          <Input
            placeholder="Enter arguments separated by ,"
            onChange={async e => {
              setParams(e.target.value.split(","));
            }}
          />
          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              if (selector !== "" && params.length > 0) {
                const abi = ["function " + selector];
                const index = selector.indexOf("(");
                const fragment = selector.substring(0, index);

                const iface = new ethers.utils.Interface(abi);
                for (let i = 0; i < params.length; i++) {
                  console.log(iface.fragments[0].inputs[i].baseType);
                  if (
                    iface.fragments[0].inputs[i].baseType.includes("uint") ||
                    iface.fragments[0].inputs[i].baseType.includes("int")
                  ) {
                    params[i] = parseInt(params[i]);
                  }
                }
                const data = iface.encodeFunctionData(fragment, params);
                setData(data);
              }
              executeTransaction();
            }}
          >
            Execute Tx
          </Button>
        </div>
      </div>
    </div>
  );
}

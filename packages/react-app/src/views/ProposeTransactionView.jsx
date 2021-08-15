import Safe, { EthersAdapter } from "@gnosis.pm/safe-core-sdk";
import { Statistic, Divider, Input, Button } from "antd";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useBalance } from "../hooks";
import { Address, Balance, EtherInput } from "../components";

export default function ProposeTransactionView({
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
  safeAddress,
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

  const [moduleAddress, setModuleAddress] = useState("");
  const [modules, setModules] = useState("");

  let safeBalance = useBalance(localProvider, safeAddress);
  let safeBalanceEth = safeBalance ? ethers.utils.formatEther(safeBalance) : "...";

  const signerLocalProvider = localProvider.getSigner();

  useEffect(() => {
    createSafe();
  }, [address]);

  useEffect(() => {
    getOwners();
    getThreshold();
    getModules();
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

  async function getModules() {
    if (safeSdk) {
      try {
        const modules = await safeSdk.getModules();
        console.log("modules: ", modules);
        // setModules(modules);
      } catch (e) {
        console.log("getModules Error: ", e);
        return;
      }
    }
  }

  return (
    <div>
      <div
        style={{
          border: "1px solid #cccccc",
          padding: 16,
          width: 600,
          margin: "auto",
          marginTop: 64,
        }}
      >
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
        <div>
          <Statistic title="Modules" value={modules} />
        </div>
      </div>
      {/* <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Modules Management</h2>
        <Input
          placeholder="Module Address"
          onChange={async e => {
            setModuleAddress(e.target.value);
          }}
        />
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            getModules();
          }}
        >
          Get
        </Button>
      </div> */}
      <div
        style={{
          border: "1px solid #cccccc",
          padding: 16,
          width: 400,
          margin: "auto",
          marginTop: 64,
          marginBottom: 180,
        }}
      >
        <h2>Propose Transaction</h2>
        <h5>Everyone to the moon and beyond!</h5>
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

          <div style={{ marginTop: 16 }}>
            <Input
              placeholder="Rationale"
              onChange={async e => {
                setParams(e.target.value.split(","));
              }}
            />
          </div>

          <Button
            style={{ marginTop: 16 }}
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
            Submit
          </Button>
        </div>
      </div>
      <div>
        <Divider />
      </div>
    </div>
  );
}

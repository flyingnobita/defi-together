import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { DID } from "dids";

export default async function CeramicInit(setCeramicState, ceramic) {
  setCeramicState("Authenticating");
  const threeIdConnect = new ThreeIdConnect();
  const resolver = {
    ...ThreeIdResolver.getResolver(ceramic),
  };
  const did = new DID({ resolver });
  ceramic.did = did;
  const addresses = await window.ethereum.enable();
  console.log("addresses: ", addresses);
  const authProvider = new EthereumAuthProvider(window.ethereum, addresses[0]);
  await threeIdConnect.connect(authProvider);

  const provider = threeIdConnect.getDidProvider();
  ceramic.did.setProvider(provider);
  await ceramic.did.authenticate();
  setCeramicState("Authenticated");
  console.log("ceramic.did.id: ", ceramic.did.id);

  return ceramic;
}

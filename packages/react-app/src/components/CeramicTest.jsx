import CeramicClient from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { randomBytes } from "@stablelib/random";
import { Button } from "antd";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyDidResolver from "key-did-resolver";
import React, { useEffect, useState } from "react";

export default function CeramicTest() {
  //https://developers.ceramic.network/run/nodes/community-nodes/
  const API_URL = "https://ceramic-clay.3boxlabs.com";

  const ceramic = new CeramicClient(API_URL);
  const seed = randomBytes(32);
  const provider = new Ed25519Provider(seed);
  const resolver = { ...KeyDidResolver.getResolver() };
  const did = new DID({ resolver });

  ceramic.did = did;
  ceramic.did.setProvider(provider);

  useEffect(() => {
    authenticate();
  }, []);

  const authenticate = async () => {
    await ceramic.did.authenticate();
  };

  const [streamId, setStreamId] = useState();

  const writeData = async () => {
    const doc = await TileDocument.create(ceramic, { foo: "bar" });
    const streamId = doc.id.toString();
    console.log("streamId: ", streamId);
    setStreamId(streamId);
  };

  const getData = async () => {
    const docRet = await TileDocument.load(ceramic, streamId);
    console.log("docRet.content: ", docRet.content);

    const stream = await ceramic.loadStream(streamId);
    console.log("stream.content: ", stream.content);
  };
  return (
    <div>
      <div>
        <Button type="primary" onClick={() => authenticate()}>
          authenticate()
        </Button>
      </div>
      <div>
        <Button type="primary" onClick={() => writeData()}>
          writeData()
        </Button>
      </div>
      <div>
        <Button type="primary" onClick={() => getData()}>
          getData()
        </Button>
      </div>
    </div>
  );
}

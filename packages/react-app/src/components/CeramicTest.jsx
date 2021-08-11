import CeramicClient from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { randomBytes } from "@stablelib/random";
import { Button, Card, Form, Input } from "antd";
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

  const [streamId, setStreamId] = useState(); // TODO: Store streamId for other apps to retrieve
  const [data, setData] = useState("");

  const writeData = async function(data) {
    console.log("writeData data: ", data);
    const doc = await TileDocument.create(ceramic, { data: data });
    const streamId = doc.id.toString();
    console.log("streamId: ", streamId);
    setStreamId(streamId);
  };

  const getData = async () => {
    const docRet = await TileDocument.load(ceramic, streamId);
    console.log("docRet.content: ", docRet.content);
    const dataToProcess = docRet.content["data"];
    const dataProcessed = Object.keys(dataToProcess).reduce(function(r, k) {
      return r.concat(k, dataToProcess[k]);
    }, []);
    console.log("dataProcessed: ", dataProcessed);
    setData(dataProcessed);

    // This gives the same result. Any difference?
    // const stream = await ceramic.loadStream(streamId);
    // console.log("stream.content: ", stream.content);
  };

  const onFinish = values => {
    // console.log("Success:", values);
    writeData(values);
  };

  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const { TextArea } = Input;
  const onChange = e => {
    // console.log("Change:", e.target.value);
  };

  return (
    <div>
      <div>
        <Form
          name="user1"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            label="User 1"
            name="user1"
            rules={[
              {
                required: false,
                message: "Please input your username!",
              },
            ]}
          >
            <TextArea showCount maxLength={100} onChange={onChange} />
          </Form.Item>

          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div>
        <Form
          name="user2"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            label="User 2"
            name="user2"
            rules={[
              {
                required: false,
                message: "Please input your username!",
              },
            ]}
          >
            <TextArea showCount maxLength={100} onChange={onChange} />
          </Form.Item>

          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div>
        <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
          <Card style={{ width: 300 }}>
            <p>{data[0] + ": " + data[1]}</p>
          </Card>
        </div>
      </div>

      {/* <div>
        <Button type="primary" onClick={() => authenticate()}>
          authenticate()
        </Button>
      </div> */}
      {/* <div>
        <Button type="primary" onClick={() => writeData()}>
          writeData()
        </Button>
      </div> */}
      <div>
        <Button type="primary" onClick={() => getData()}>
          getData()
        </Button>
      </div>
    </div>
  );
}

import { TileDocument } from "@ceramicnetwork/stream-tile";
import { Button, Card, Form, Input } from "antd";
import React, { useEffect, useState } from "react";

export default function CeramicView({ ceramic }) {
  const [streamId, setStreamId] = useState();
  const [data, setData] = useState("");

  useEffect(() => {}, [ceramic]);

  const writeData = async function (data) {
    if (ceramic) {
      const newContent = { data: data };
      const metadata = { controllers: [ceramic.did.id], tags: ["a"], deterministic: true };
      let doc = await TileDocument.create(ceramic, null, metadata);
      let streamId = doc.id.toString();
      setStreamId(streamId);

      doc = await TileDocument.load(ceramic, streamId);
      await doc.update(newContent);
      streamId = doc.id.toString();
    }
  };

  const getData = async () => {
    const controller = ceramic.did.id;
    const docRet = await TileDocument.create(
      ceramic,
      null,
      {
        controllers: [controller],
        tags: ["a"],
        deterministic: true,
      },
      { anchor: false, publish: false },
    );

    const dataToProcess = docRet.content["data"];
    if (dataToProcess) {
      const dataProcessed = Object.keys(dataToProcess).reduce(function (r, k) {
        return r.concat(k, dataToProcess[k]);
      }, []);

      setData(dataProcessed);
    }
  };

  const onFinish = values => {
    writeData(values);
  };

  const onFinishFailed = errorInfo => {
    console.log("Failed:", errorInfo);
  };

  const { TextArea } = Input;
  const onChange = e => {};

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
      <div>
        <Button type="primary" onClick={() => getData()}>
          Retrieve
        </Button>
      </div>
    </div>
  );
}

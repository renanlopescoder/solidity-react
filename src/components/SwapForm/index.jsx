import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { SwapOutlined, ShrinkOutlined } from "@ant-design/icons";

import { buyTokens, sellTokens } from "../../services/blockchain-service";

function SwapForm({ account, ethBalance, tokenBalance }) {
  const [tokenAmount, setTokenAmount] = useState(0);
  const [ethAmount, setEthAmount] = useState(0);
  const [isBuyToken, setIsBuyToken] = useState(true);

  const onFinish = (values) => {
    if (isBuyToken) {
      // values.eth is the amount to buy
      buyTokens(account, values.ether);
    } else {
      sellTokens(account, values.token);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Form
      {...layout}
      name="swap"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="ETH"
        name="ether"
        rules={[
          {
            required: isBuyToken,
            message: "Please input value",
          },
        ]}
      >
        <Input
          placeholder={isBuyToken ? ethBalance.balance : ethAmount}
          onChange={(event) => setTokenAmount(event.target.value * 100)}
          autoComplete="off"
          disabled={!isBuyToken}
          type="number"
        />
      </Form.Item>

      <Form.Item
        label="Melody Coin"
        name="token"
        rules={[
          {
            required: !isBuyToken,
            message: "Please input value",
          },
        ]}
      >
        <Input
          type="number"
          disabled={isBuyToken}
          placeholder={isBuyToken ? tokenAmount : tokenBalance.balance}
          onChange={(event) => setEthAmount(event.target.value / 100)}
        />
      </Form.Item>

      <Form.Item {...tailLayout}>
        <Button
          type="primary"
          htmlType="submit"
          style={{ marginRight: "20px" }}
        >
          Swap <SwapOutlined />
        </Button>
        <Button type="primary" onClick={() => setIsBuyToken(!isBuyToken)}>
          {isBuyToken ? "ETH x MLD" : "MLD x ETH"} <ShrinkOutlined />
        </Button>
      </Form.Item>
    </Form>
  );
}

const layout = {
  labelCol: {
    span: 8,
  },
  wrapperCol: {
    span: 8,
  },
};
const tailLayout = {
  wrapperCol: {
    offset: 8,
    span: 16,
  },
};

export default SwapForm;

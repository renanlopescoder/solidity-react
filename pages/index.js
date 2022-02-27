import React, { useState, useEffect, Fragment } from "react";
import { PageHeader, Tabs, Button, Statistic, Descriptions } from "antd";

import { getBlockchainData } from "../src/services/blockchain-service";
import styles from "../styles/Home.module.css";

import SwapForm from "../src/components/SwapForm";

const { TabPane } = Tabs;

function Home() {
  const [account, setAccount] = useState("");
  const [ethBalance, setEthBalance] = useState({});
  const [tokenBalance, setTokenBalance] = useState({});

  useEffect(() => {
    getBlockchainData().then((data) => {
      setAccount(data.account);
      setTokenBalance(data.tokenBalanceData);
      setEthBalance(data.ethBalanceData);
    });
  }, []);

  const renderContent = () => (
    <Fragment>
      <Descriptions title="About" size="small" column={2}>
        <Descriptions.Item label="Asset">Melody (MLD)</Descriptions.Item>
        <Descriptions.Item label="Association">
          <a>421421</a>
        </Descriptions.Item>
        <Descriptions.Item label="Creation Time">2021-01-23</Descriptions.Item>
        <Descriptions.Item label="Exchange Rate">
          1 ETH = 100 MLD
        </Descriptions.Item>
        <Descriptions.Item label="Description">
          Melody is the musicians crypto coin
        </Descriptions.Item>
      </Descriptions>
      <br />
      <Descriptions title="Wallet" size="small" column={1}>
        <Descriptions.Item label="Address">{account}</Descriptions.Item>
      </Descriptions>
      <Statistic
        title="Balance Melody"
        value={tokenBalance.balance}
        style={{
          marginRight: 32,
        }}
      />
      <Statistic title="Balance ETH" value={ethBalance.balance} />
    </Fragment>
  );

  const headerSignature = () => {
    return [
      <img
        key="1"
        src={require("../src/assets/eth-logo-name.jpg")}
        alt="Eth Logo"
        className={styles.logo}
      />,
      <Button key="2">
        <a target="_blank" href="https://renanlopes.com">
          By Renan Lopes
        </a>
      </Button>,
      <Button key="3">
        <a target="_blank" href="https://github.com/renanlopescoder">
          GitHub
        </a>
      </Button>,
    ];
  };

  const getTabs = () => (
    <Tabs defaultActiveKey="1">
      <TabPane tab="Details" key="1">
        Melody crypto coin was created for development and learning purpose
        <SwapForm
          ethBalance={ethBalance}
          account={account}
          tokenBalance={tokenBalance}
        />
      </TabPane>
      <TabPane tab="Rule" key="2">
        Sample rules
      </TabPane>
    </Tabs>
  );

  return (
    <>
      <PageHeader
        title="Ethereum Network"
        subTitle="Swap Ethereum to Melody Crypto Coin"
        extra={headerSignature()}
        footer={getTabs()}
      >
        {renderContent()}
      </PageHeader>
    </>
  );
}

export default Home;

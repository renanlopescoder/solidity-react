pragma solidity ^0.5.0;

import "./Token.sol";

contract EthSwap {
  string public name = "EthSwap Instant Exchange";
  Token public token;
  uint public rate = 100;

  // Event definition
  event TokensPurchased(
    address account,
    address token,
    uint amount,
    uint rate
  );

  event TokensSold(
    address account,
    address token,
    uint amount,
    uint rate
  );

  constructor(Token _token) public {
    token = _token;
  }

  function buyTokens() public payable {
    // Redemption rate = {amount} of tokens they receive for 1 ether
    // Amount of Ethereum * Redemption rate
    // msg.value function caller value
    uint tokenAmount = msg.value * rate;

    // Make sure we have tokens on contract to continue the execution
    // address(this) is the smart contract
    require(token.balanceOf(address(this)) >= tokenAmount);

    // msg.sender is who is calling the function
    token.transfer(msg.sender, tokenAmount);

    // Emit event token purchased
    emit TokensPurchased(msg.sender, address(token), tokenAmount, rate);
  }


  function sellTokens(uint _amount) public {
    //Users can't sell more tokens that they have
    require(token.balanceOf(msg.sender) >= _amount);

    // Calculate the Ether to redeem
    uint etherAmount = _amount / rate;

    // Require that the EthSwap contract has enough Ether
    require(address(this).balance >= etherAmount);

    // Perform sale tokens
    token.transferFrom(msg.sender, address(this), _amount);
    msg.sender.transfer(etherAmount);

    // Emit sold tokens event
    emit TokensSold(msg.sender, address(token), _amount, rate);
  }
}

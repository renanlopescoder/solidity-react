// Deposit & Withdraw Funds
// Manage Orders - Make or Cancel
// Handle Trades - Charge fees

// TODO
// [X] Set the fee account
// [X] Deposit Ether
// [X] Withdraw Ether
// [X] Deposit Tokens
// [X] Withdraw Tokens
// [X] Check Balances
// [X] Make order
// [X] Cancel order
// [X] Fill order
// [X] Charge fees

pragma solidity >=0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Token.sol";

contract Exchange {
    using SafeMath for uint;

    address public feeAccount; // The account that receives exchange fees
    uint256 public feePercent; // The fee percentage
    address constant ETHER = address(0); // Store Ether in tokens mapping with blank address
    uint256 public orderCount; // Order ID

    // Mappings

    mapping(address => mapping(address => uint256)) public tokens; // Mapping Tokens > user address and amount
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    // Events

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
    event Cancel(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
    event Trade(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address userFill, uint256 timestamp);

    // Structs

    struct _Order {
      uint256 id;
      address user;
      address tokenGet;
      uint256 amountGet;
      address tokenGive;
      uint256 amountGive;
      uint256 timestamp;
    }


    constructor (address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Fallback: Reverts if Ether is sent to this smart contract by mistake
    function() external {
      revert();
    }

    function depositEther() payable public {
      tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
      emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint _amount) public {
      require(tokens[ETHER][msg.sender] >= _amount); // Verify the user have the amount on the exchange
      tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
      msg.sender.transfer(_amount); // Send the Ether amount to the user
      emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    function depositToken(address _token, uint _amount) public {
      require(_token != ETHER); // Require to be a token and rejects Ether transactions

      require(Token(_token).transferFrom(msg.sender, address(this), _amount));
      tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
      emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
      require(_token != ETHER);
      require(tokens[_token][msg.sender] >= _amount);
      tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
      require(Token(_token).transfer(msg.sender, _amount));
      emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }


    function balanceOf(address _token, address _user) public view returns (uint256) {
      return tokens[_token][_user];
    }

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
      orderCount = orderCount.add(1);
      orders[orderCount]  = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
      emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
    }

    function cancelOrder(uint256 _id) public {
        // Fetch order from storage type _Order
        _Order storage _order = orders[_id];
        require(address(_order.user) == msg.sender); // Verify user address
        require(_order.id == _id); // The order must exists

        orderCancelled[_id] = true;
        emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, _order.timestamp);
    }

    function fillOrder(uint256 _id) public {
      require(_id > 0 && _id <= orderCount);
      require(!orderFilled[_id]);
      require(!orderCancelled[_id]);

      _Order storage _order = orders[_id];
      _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);

      orderFilled[_order.id] = true;
    }


    function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
      // Fee paid by the user that fills the order "msg.sender"
      uint256 _feeAmount = _amountGive.mul(feePercent).div(100);

      // The _user is the user that created the order
      // The msg.sender is the user filling the order
      tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
      tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);

      tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
      tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
      tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);

      emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
    }
}

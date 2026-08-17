// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProjectEscrow {
    enum Status {
        Empty,
        Funded,
        Released,
        Refunded
    }

    struct Deal {
        address customer;
        address executor;
        uint256 amount;
        uint256 releasedAmount;
        Status status;
    }

    uint16 public immutable feeBps;
    address payable public immutable feeRecipient;
    address public immutable arbiter;
    mapping(bytes32 => Deal) public deals;

    event Funded(bytes32 indexed dealId, address indexed customer, address indexed executor, uint256 amount);
    event Released(bytes32 indexed dealId, address indexed executor, uint256 executorAmount, uint256 feeAmount);
    event Refunded(bytes32 indexed dealId, address indexed customer, uint256 amount);

    constructor(address payable _feeRecipient, uint16 _feeBps) {
        require(_feeRecipient != address(0), "fee recipient required");
        require(_feeBps <= 1_000, "fee too high");
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
        arbiter = msg.sender;
    }

    function fund(bytes32 dealId, address executor) external payable {
        require(dealId != bytes32(0), "deal id required");
        require(executor != address(0), "executor required");
        require(msg.value > 0, "amount required");
        require(deals[dealId].status == Status.Empty, "deal exists");

        deals[dealId] = Deal({
            customer: msg.sender,
            executor: executor,
            amount: msg.value,
            releasedAmount: 0,
            status: Status.Funded
        });

        emit Funded(dealId, msg.sender, executor, msg.value);
    }

    function release(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Funded, "not funded");
        require(msg.sender == deal.customer || msg.sender == arbiter, "only customer or arbiter");

        uint256 remainingAmount = deal.amount - deal.releasedAmount;
        _releaseAmount(dealId, deal, remainingAmount);
    }

    function releasePartial(bytes32 dealId, uint256 amount) external {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Funded, "not funded");
        require(msg.sender == deal.customer || msg.sender == arbiter, "only customer or arbiter");
        require(amount > 0, "amount required");
        require(deal.releasedAmount + amount <= deal.amount, "amount exceeds escrow");

        _releaseAmount(dealId, deal, amount);
    }

    function refund(bytes32 dealId) external {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Funded, "not funded");
        require(msg.sender == deal.customer || msg.sender == arbiter, "only customer or arbiter");

        uint256 refundAmount = deal.amount - deal.releasedAmount;
        require(refundAmount > 0, "nothing to refund");

        deal.releasedAmount = deal.amount;
        deal.status = Status.Refunded;

        payable(deal.customer).transfer(refundAmount);

        emit Refunded(dealId, deal.customer, refundAmount);
    }

    function _releaseAmount(bytes32 dealId, Deal storage deal, uint256 amount) internal {
        deal.releasedAmount += amount;
        if (deal.releasedAmount == deal.amount) {
            deal.status = Status.Released;
        }

        uint256 feeAmount = (amount * feeBps) / 10_000;
        uint256 executorAmount = amount - feeAmount;

        if (feeAmount > 0) {
            feeRecipient.transfer(feeAmount);
        }
        payable(deal.executor).transfer(executorAmount);

        emit Released(dealId, deal.executor, executorAmount, feeAmount);
    }
}

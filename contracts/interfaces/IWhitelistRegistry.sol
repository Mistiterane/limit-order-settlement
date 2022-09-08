// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;
pragma abicoder v1;

interface IWhitelistRegistry {
    function isWhitelisted(address addr) external view returns (bool);
}

const { constants, trim0x, time } = require('@1inch/solidity-utils');
const { utils } = require('ethers');

const Order = [
    { name: 'salt', type: 'uint256' },
    { name: 'makerAsset', type: 'address' },
    { name: 'takerAsset', type: 'address' },
    { name: 'maker', type: 'address' },
    { name: 'receiver', type: 'address' },
    { name: 'allowedSender', type: 'address' },
    { name: 'makingAmount', type: 'uint256' },
    { name: 'takingAmount', type: 'uint256' },
    { name: 'offsets', type: 'uint256' },
    { name: 'interactions', type: 'bytes' },
];

const name = '1inch Limit Order Protocol';
const version = '3';

const buildOrder = async (
    {
        salt,
        makerAsset,
        takerAsset,
        makingAmount,
        takingAmount,
        allowedSender = constants.ZERO_ADDRESS,
        receiver = constants.ZERO_ADDRESS,
        from: maker = constants.ZERO_ADDRESS,
    },
    {
        makerAssetData = '0x',
        takerAssetData = '0x',
        getMakingAmount = '0x',
        getTakingAmount = '0x',
        predicate = '0x',
        permit = '0x',
        preInteraction = '0x',
        postInteraction = '0x',
    } = {},
) => {
    if (getMakingAmount === '') {
        getMakingAmount = '0x78'; // "x"
    }
    if (getTakingAmount === '') {
        getTakingAmount = '0x78'; // "x"
    }
    if (typeof salt === 'undefined') {
        salt = buildSalt({ orderStartTime: await defaultExpiredAuctionTimestamp() });
    }

    const allInteractions = [
        makerAssetData,
        takerAssetData,
        getMakingAmount,
        getTakingAmount,
        predicate,
        permit,
        preInteraction,
        postInteraction,
    ];

    const interactions = '0x' + allInteractions.map(trim0x).join('');

    // https://stackoverflow.com/a/55261098/440168
    const cumulativeSum = ((sum) => (value) => {
        sum += value;
        return sum;
    })(0);
    const offsets = allInteractions
        .map((a) => a.length / 2 - 1)
        .map(cumulativeSum)
        .reduce((acc, a, i) => acc + (BigInt(a) << BigInt(32 * i)), BigInt(0));

    return {
        salt,
        makerAsset,
        takerAsset,
        maker,
        receiver,
        allowedSender,
        makingAmount: makingAmount.toString(),
        takingAmount: takingAmount.toString(),
        offsets: offsets.toString(),
        interactions,
    };
};

const defaultExpiredAuctionTimestamp = async () => BigInt(await time.latest()) - BigInt(1800);

const buildSalt = ({
    orderStartTime,
    initialStartRate = 1000, // 10000 = 100%
    duration = 180, // seconds
    fee = 0, // in wei
    salt = '1', // less than uint176
}) =>
    (
        (BigInt(orderStartTime) << BigInt(224)) +
        (BigInt(duration) << BigInt(192)) +
        (BigInt(initialStartRate) << BigInt(176)) +
        (BigInt(fee) << BigInt(144)) +
        BigInt(salt)
    ).toString();

async function signOrder(order, chainId, target, wallet) {
    return await wallet._signTypedData({ name, version, chainId, verifyingContract: target }, { Order }, order);
}

function ether(num) {
    return utils.parseUnits(num);
}

module.exports = {
    buildOrder,
    buildSalt,
    signOrder,
    defaultExpiredAuctionTimestamp,
    ether,
    name,
    version,
};

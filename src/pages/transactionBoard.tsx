// import React, { useEffect } from "react";
// import { useQuery } from "@apollo/client";
// import { GET_STAKING_TRANSACTIONS } from "../utils/subgraph/queries";
// import client from "../utils/subgraph/apolloClient";
// import Spinner from "../components/Spinner";
// import { useMemo } from "react";

// export const shortNumber = (num: number) => {
//     let formatted: string;

//     if (num >= 1e9) formatted = (num / 1e9).toFixed(2) + "B";
//     else if (num >= 1e6) formatted = (num / 1e6).toFixed(2) + "M";
//     else if (num >= 1e3) formatted = (num / 1e3).toFixed(2) + "K";
//     else formatted = num.toFixed(2);

//     // Remove trailing zeros and unnecessary decimal points
//     return formatted.replace(/\.?0+([KM])?$/, '$1') + " ";
// };


// interface Transaction {
//     id: string;
//     event: 'Stake' | 'Unstake';
//     timestamp: string;
//     from: string;
//     to: string;
//     amount: string;
//     transactionHash: string;
// }

// interface StakeData {
//     id: string;
//     user: string;
//     internal_id: string;
//     amount: string;
//     numDays: string;
//     endTime: string;
//     blockNumber: string;
//     blockTimestamp: string;
//     transactionHash: string;
// }

// interface WithdrawData {
//     id: string;
//     user: string;
//     internal_id: string;
//     stakedAmount: string;
//     reward: string;
//     totalAmount: string;
//     blockNumber: string;
//     blockTimestamp: string;
//     transactionHash: string;
// }

// interface GetTransactionsData {
//     stakeds: StakeData[];
//     withdrawns: WithdrawData[];
// }

// const TransactionTable = () => {

//     const { loading, error, data } = useQuery<GetTransactionsData>(GET_STAKING_TRANSACTIONS, {
//         client,
//     });

//     useEffect(() => {
//         if (error) {
//             alert(error.message)
//         }
//     }, [error]);

//     const transactions: Transaction[] = useMemo(() => {
//         if (!data) return [];
        
//         const stakes = data.stakeds?.map((stake) => ({
//             id: stake.id,
//             event: 'Stake' as const,
//             timestamp: stake.blockTimestamp,
//             from: stake.user,
//             to: 'Contract',
//             amount: stake.amount,
//             transactionHash: stake.transactionHash,
//         })) || [];

//         const unstakes = data.withdrawns?.map((withdraw) => ({
//             id: withdraw.id,
//             event: 'Unstake' as const,
//             timestamp: withdraw.blockTimestamp,
//             from: 'Contract',
//             to: withdraw.user,
//             amount: withdraw.totalAmount,
//             transactionHash: withdraw.transactionHash,
//         })) || [];

//         return [...stakes, ...unstakes].sort((a, b) => 
//             Number(b.timestamp) - Number(a.timestamp)
//         );
//     }, [data]);

//     const formatAge = (timestamp: string) => {
//         const seconds = Math.floor(Date.now() / 1000) - Number(timestamp);
//         if (seconds < 60) return `${seconds}s ago`;
//         if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
//         if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
//         return `${Math.floor(seconds / 86400)}d ago`;
//     };

//     return (
//         <>
//             {
//                 loading ? <Spinner size='12' color='white' /> : (
//                     <>
//                         <div className="w-full lg:flex hidden flex-col items-center relative bg-card-bg rounded-3xl overflow-hidden md:px-8 px-4 md:py-6 py-3">
//                             {/* Table Header */}
//                             <div className="w-full rounded-t-3xl flex justify-between items-center md:px-6 px-1 py-4 text-primary md:text-lg text-sm font-bold sticky top-0 z-10">
//                                 <span className="md:w-2/12 w-2/12">Txn Hash</span>
//                                 <span className="md:w-1/12 w-1/12">Event</span>
//                                 <span className="md:w-1/12 w-1/12">Age</span>
//                                 <span className="md:w-3/12 w-3/12">From</span>
//                                 <span className="md:w-3/12 w-3/12">To</span>
//                                 <span className="md:w-2/12 w-2/12">Amount</span>
//                             </div>

//                             {/* Scrollable Rows */}
//                             <div className="w-full overflow-y-auto max-h-[600px]">
//                                 {transactions.map((tx, index) => (
//                                     <div
//                                         key={tx.id}
//                                         className="w-full flex justify-between items-center md:px-6 px-1 py-4 text-light text-sm md:text-base backdrop-blur border-t border-light-border"
//                                     >
//                                         <span className="md:w-2/12 w-2/12">
//                                             <a 
//                                                 href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`} 
//                                                 target="_blank" 
//                                                 rel="noopener noreferrer"
//                                                 className="text-blue-400 hover:text-blue-300 hover:underline"
//                                             >
//                                                 {tx.transactionHash.slice(0, 8)}...
//                                             </a>
//                                         </span>
//                                         <span className={`md:w-1/12 w-1/12 font-semibold ${tx.event === 'Stake' ? 'text-green-400' : 'text-orange-400'}`}>
//                                             {tx.event}
//                                         </span>
//                                         <span className="md:w-1/12 w-1/12">{formatAge(tx.timestamp)}</span>
//                                         <span className="md:w-3/12 w-3/12">
//                                             {tx.from === 'Contract' ? (
//                                                 <span className="text-gray-400">Contract</span>
//                                             ) : (
//                                                 <span>{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span>
//                                             )}
//                                         </span>
//                                         <span className="md:w-3/12 w-3/12">
//                                             {tx.to === 'Contract' ? (
//                                                 <span className="text-gray-400">Contract</span>
//                                             ) : (
//                                                 <span>{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
//                                             )}
//                                         </span>
//                                         <span className="md:w-2/12 w-2/12">
//                                             {shortNumber(Number(tx.amount) / 10 ** 18)} BULLZILLA
//                                         </span>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>

//                         <div className="w-full lg:hidden flex flex-col relative bg-card-bg rounded-3xl overflow-hidden md:px-8 px-4 md:py-6 py-3">
//                             <div className="space-y-4 w-full">
//                                 {transactions.map((tx, index) => (
//                                     <div className="flex flex-col gap-3 border-b border-b-light-border last:border-b-0 pb-4" key={tx.id}>
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-primary font-semibold">Txn Hash</span>
//                                             <a 
//                                                 href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`} 
//                                                 target="_blank" 
//                                                 rel="noopener noreferrer"
//                                                 className="text-blue-400 hover:text-blue-300 text-sm"
//                                             >
//                                                 {tx.transactionHash.slice(0, 10)}...
//                                             </a>
//                                         </div>
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-primary font-semibold">Event</span>
//                                             <span className={`font-semibold ${tx.event === 'Stake' ? 'text-green-400' : 'text-orange-400'}`}>
//                                                 {tx.event}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-primary font-semibold">Age</span>
//                                             <span className="text-light">{formatAge(tx.timestamp)}</span>
//                                         </div>
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-primary font-semibold">From</span>
//                                             <span className="text-light">
//                                                 {tx.from === 'Contract' ? 'Contract' : `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-primary font-semibold">To</span>
//                                             <span className="text-light">
//                                                 {tx.to === 'Contract' ? 'Contract' : `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}
//                                             </span>
//                                         </div>
//                                         <div className="flex justify-between items-center">
//                                             <span className="text-primary font-semibold">Amount</span>
//                                             <span className="text-light">
//                                                 {shortNumber(Number(tx.amount) / 10 ** 18)} BULLZILLA
//                                             </span>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     </>
//                 )
//             }
//         </>
//     );

// };

// const TransactionBoard: React.FC = () => {
//     return (
//         <div className="bg-primary-bg rounded-b-[60px] relative z-[10]">
//             <div className="w-full 2xl:w-[1280px] 2xl:mx-auto md:px-8 2xl:px-0 px-4 pb-[150px]">
//                 {/* Hero Section */}
//                 <div className="relative w-full md:pt-[80px] pt-[30px]">
//                     {/* Content */}
//                     <div className="relative flex flex-col items-center min-h-lvh text-white pt-20 gap-3">
//                         <div className="text-6xl xl:text-8xl lg:text-5xl md:text-3xl mt-3 lg:w-[95%] w-full text-primary font-semibold text-center pb-16">
//                             Transactions
//                         </div>
//                         <TransactionTable />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default TransactionBoard;

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_STAKING_TRANSACTIONS } from "../utils/subgraph/queries";
import client from "../utils/subgraph/apolloClient";
import Spinner from "../components/Spinner";

export const shortNumber = (num: number) => {
    let formatted: string;

    if (num >= 1e9) formatted = (num / 1e9).toFixed(2) + "B";
    else if (num >= 1e6) formatted = (num / 1e6).toFixed(2) + "M";
    else if (num >= 1e3) formatted = (num / 1e3).toFixed(2) + "K";
    else formatted = num.toFixed(2);

    // Remove trailing zeros and unnecessary decimal points
    return formatted.replace(/\.?0+([KM])?$/, '$1');
};

const formatAmount = (amount: number) => {
    return Math.floor(amount).toLocaleString('en-US');
};

interface StakeData {
    id: string;
    user: string;
    internal_id: string;
    amount: string;
    numDays: string;
    endTime: string;
    blockNumber: string;
    blockTimestamp: string;
    transactionHash: string;
}

interface WithdrawData {
    id: string;
    user: string;
    internal_id: string;
    stakedAmount: string;
    reward: string;
    totalAmount: string;
    blockNumber: string;
    blockTimestamp: string;
    transactionHash: string;
}

interface GetTransactionsData {
    stakeds: StakeData[];
    withdrawns: WithdrawData[];
}

interface UserStakeInfo {
    address: string;
    stakeCount: number;
    totalReward: number;
    totalStaked: number;
    activeCount: number;
    withdrawnCount: number;
}

interface StakeTransaction {
    id: string;
    timestamp: string;
    from: string;
    to: string;
    amount: string;
    reward: string;
    transactionHash: string;
    positionId: string;
    isWithdrawn: boolean;
    withdrawnTxHash?: string;
}

// Modal Component
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    userAddress: string;
    stakes: StakeTransaction[];
}

const TransactionModal: React.FC<ModalProps> = ({ isOpen, onClose, userAddress, stakes }) => {
    if (!isOpen) return null;

    const formatAge = (timestamp: string) => {
        const seconds = Math.floor(Date.now() / 1000) - Number(timestamp);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card-bg rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-light-border">
                    <div>
                        <h2 className="text-2xl font-bold text-primary">Stake History</h2>
                        <p className="text-light text-sm mt-1">
                            {userAddress.slice(0, 10)}...{userAddress.slice(-8)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-primary hover:text-light text-3xl font-bold w-10 h-10 flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>

                {/* Modal Content - Desktop */}
                <div className="overflow-y-auto flex-1 p-6">
                    {stakes.length === 0 ? (
                        <div className="text-center text-light py-12">
                            No stake history found
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-primary text-sm font-bold border-b border-light-border">
                                            <th className="py-3 px-4 text-center">Txn Hash</th>
                                            <th className="py-3 px-4 text-center">Age</th>
                                            <th className="py-3 px-4 text-center">Amount</th>
                                            <th className="py-3 px-4 text-center">Reward</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stakes.map((stake) => (
                                            <tr key={stake.id} className="border-b border-light-border hover:bg-opacity-10 hover:bg-white">
                                                <td className="py-4 px-4 text-center">
                                                    <a
                                                        href={`https://sepolia.etherscan.io/tx/${stake.transactionHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 hover:underline"
                                                    >
                                                        {stake.transactionHash.slice(0, 10)}...
                                                    </a>
                                                </td>
                                                <td className="py-4 px-4 text-center text-light">
                                                    {formatAge(stake.timestamp)}
                                                </td>
                                                <td className="py-4 px-4 text-center text-light">
                                                    {formatAmount(Number(stake.amount) / 10 ** 18)}
                                                </td>
                                                <td className="py-4 px-4 text-center text-green-400 font-semibold">
                                                    {Number(stake.reward) === 0 ? '-' : formatAmount(Number(stake.reward) / 10 ** 18)}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    {stake.isWithdrawn ? (
                                                        <a
                                                            href={`https://sepolia.etherscan.io/tx/${stake.withdrawnTxHash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1 rounded-full text-xs font-semibold bg-red-400 bg-opacity-20 text-red-400 hover:text-red-300 underline inline-block"
                                                        >
                                                            Unstaked
                                                        </a>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 bg-opacity-20 text-green-400">
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="lg:hidden space-y-4">
                                {stakes.map((stake) => (
                                    <div key={stake.id} className="border border-light-border rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-primary font-semibold">Txn Hash</span>
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${stake.transactionHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 text-sm"
                                            >
                                                {stake.transactionHash.slice(0, 10)}...
                                            </a>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-primary font-semibold">Age</span>
                                            <span className="text-light">{formatAge(stake.timestamp)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-primary font-semibold">Amount</span>
                                            <span className="text-light">
                                                {formatAmount(Number(stake.amount) / 10 ** 18)} BULLZILLA
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-primary font-semibold">Reward</span>
                                            <span className="text-green-400 font-semibold">
                                                {Number(stake.reward) === 0 ? '-' : `${formatAmount(Number(stake.reward) / 10 ** 18)} BULLZILLA`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-primary font-semibold">Status</span>
                                            {stake.isWithdrawn ? (
                                                <a
                                                    href={`https://sepolia.etherscan.io/tx/${stake.withdrawnTxHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500 bg-opacity-20 text-gray-400 hover:text-gray-300 hover:underline"
                                                >
                                                    Withdrawn
                                                </a>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500 bg-opacity-20 text-green-400">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const TransactionTable = () => {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { loading, error, data } = useQuery<GetTransactionsData>(GET_STAKING_TRANSACTIONS, {
        client,
    });

    useEffect(() => {
        if (error) {
            alert(error.message);
        }
    }, [error]);

    // Group stakes by user address and calculate total rewards
    const userStakes: UserStakeInfo[] = useMemo(() => {
        if (!data) return [];

        const userMap = new Map<string, { 
            count: number; 
            totalReward: number; 
            totalStaked: number;
            activeCount: number;
            withdrawnCount: number;
            originalAddress: string;
            positionIds: Set<string>;
        }>();

        // Count stakes per user
        data.stakeds?.forEach((stake) => {
            const address = stake.user.toLowerCase();
            if (!userMap.has(address)) {
                userMap.set(address, { 
                    count: 0, 
                    totalReward: 0, 
                    totalStaked: 0,
                    activeCount: 0,
                    withdrawnCount: 0,
                    originalAddress: stake.user,
                    positionIds: new Set()
                });
            }
            const userInfo = userMap.get(address)!;
            userInfo.count += 1;
            userInfo.totalStaked += Number(stake.amount);
            userInfo.positionIds.add(stake.internal_id);
        });

        // Calculate total rewards from withdrawals (key by user+position to avoid cross-user collisions)
        const withdrawnPositions = new Set<string>();
        data.withdrawns?.forEach((withdraw) => {
            const address = withdraw.user.toLowerCase();
            if (userMap.has(address)) {
                const userInfo = userMap.get(address)!;
                userInfo.totalReward += Number(withdraw.reward);
                withdrawnPositions.add(`${address}-${withdraw.internal_id}`);
            }
        });
        userMap.forEach((userInfo, address) => {
            userInfo.positionIds.forEach((positionId) => {
                if (withdrawnPositions.has(`${address}-${positionId}`)) {
                    userInfo.withdrawnCount += 1;
                } else {
                    userInfo.activeCount += 1;
                }
            });
        });

        return Array.from(userMap.entries())
            .map(([address, info]) => ({
                address: info.originalAddress,
                stakeCount: info.count,
                totalReward: info.totalReward,
                totalStaked: info.totalStaked,
                activeCount: info.activeCount,
                withdrawnCount: info.withdrawnCount
            }))
            .sort((a, b) => b.stakeCount - a.stakeCount);
    }, [data]);

    // Get stake transactions for selected user
    const getUserStakes = (userAddress: string): StakeTransaction[] => {
        if (!data) return [];

        // Create a map of position ID to withdrawal data
        const withdrawalMap = new Map<string, WithdrawData>();
        data.withdrawns
            ?.filter(withdraw => withdraw.user.toLowerCase() === userAddress.toLowerCase())
            .forEach(withdraw => {
                withdrawalMap.set(withdraw.internal_id, withdraw);
            });

        // Map stakes with their withdrawal info
        const stakes: StakeTransaction[] = data.stakeds
            ?.filter(stake => stake.user.toLowerCase() === userAddress.toLowerCase())
            .map(stake => {
                const withdrawal = withdrawalMap.get(stake.internal_id);
                return {
                    id: stake.id,
                    timestamp: stake.blockTimestamp,
                    from: stake.user,
                    to: 'Contract',
                    amount: stake.amount,
                    reward: withdrawal ? withdrawal.reward : '0',
                    transactionHash: stake.transactionHash,
                    positionId: stake.internal_id,
                    isWithdrawn: !!withdrawal,
                    withdrawnTxHash: withdrawal?.transactionHash,
                };
            }) || [];

        return stakes.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    };

    const handleRowClick = (user: UserStakeInfo) => {
        setSelectedUser(user.address);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const selectedUserStakes = selectedUser ? getUserStakes(selectedUser) : [];

    return (
        <>
            {loading ? (
                <Spinner size='12' color='white' />
            ) : (
                <div className="w-full">
                    {/* Desktop View */}
                    <div className="w-full lg:flex hidden flex-col items-center relative bg-card-bg rounded-3xl overflow-hidden md:px-8 px-4 md:py-6 py-3">
                        {/* Table Header */}
                        <div className="w-full rounded-t-3xl flex justify-between items-center md:px-6 px-1 py-4 text-primary md:text-lg text-sm font-bold sticky top-0 z-10">
                            <span className="w-[5%]">#</span>
                            <span className="w-[25%]">Address</span>
                            <span className="w-[12%] text-center">Total Staked</span>
                            <span className="w-[10%] text-center">Stake Count</span>
                            <span className="w-[10%] text-center">Active</span>
                            <span className="w-[10%] text-center">Withdrawn</span>
                            <span className="w-[18%] text-center">Total Reward</span>
                        </div>

                        {/* Scrollable Rows */}
                        <div className="w-full overflow-y-auto max-h-[600px]">
                            {userStakes.map((user, index) => (
                                <div
                                    key={user.address}
                                    onClick={() => handleRowClick(user)}
                                    className="w-full flex justify-between items-center md:px-6 px-1 py-4 text-light text-sm md:text-base backdrop-blur border-t border-light-border cursor-pointer hover:bg-opacity-10 hover:bg-white transition-colors"
                                >
                                    <span className="w-[5%]">{index + 1}</span>
                                    <span className="w-[25%]">
                                        {user.address.slice(0, 10)}...{user.address.slice(-8)}
                                    </span>
                                    <span className="w-[12%] text-center font-semibold">
                                        {formatAmount(user.totalStaked / 10 ** 18)}
                                    </span>
                                    <span className="w-[10%] text-center font-semibold">
                                        {user.stakeCount}
                                    </span>
                                    <span className="w-[10%] text-center text-green-400 font-semibold">
                                        {user.activeCount}
                                    </span>
                                    <span className="w-[10%] text-center text-gray-400 font-semibold">
                                        {user.withdrawnCount}
                                    </span>
                                    <span className="w-[18%] text-center text-green-400 font-semibold">
                                        {formatAmount(user.totalReward / 10 ** 18)} BULLZILLA
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="w-full lg:hidden flex flex-col relative bg-card-bg rounded-3xl overflow-hidden md:px-8 px-4 md:py-6 py-3">
                        <div className="space-y-4 w-full">
                            {userStakes.map((user, index) => (
                                <div
                                    key={user.address}
                                    onClick={() => handleRowClick(user)}
                                    className="flex flex-col gap-3 border border-light-border rounded-xl p-4 cursor-pointer hover:bg-opacity-10 hover:bg-white transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-primary font-semibold">#</span>
                                        <span className="text-light">{index + 1}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-primary font-semibold">Address</span>
                                        <span className="text-light text-sm">
                                            {user.address.slice(0, 8)}...{user.address.slice(-6)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-primary font-semibold">Stake Count</span>
                                        <span className="text-light font-semibold">
                                            {user.stakeCount}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-primary font-semibold">Total Reward</span>
                                        <span className="text-green-400 font-semibold">
                                            {formatAmount(user.totalReward / 10 ** 18)} BULLZILLA
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stake History Modal */}
            {selectedUser && (
                <TransactionModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    userAddress={selectedUser}
                    stakes={selectedUserStakes}
                />
            )}
        </>
    );
};

const TransactionBoard: React.FC = () => {
    return (
        <div className="bg-primary-bg rounded-b-[60px] relative z-[10]">
            <div className="w-full 2xl:w-[1280px] 2xl:mx-auto md:px-8 2xl:px-0 px-4 pb-[150px]">
                {/* Hero Section */}
                <div className="relative w-full md:pt-[80px] pt-[30px]">
                    {/* Content */}
                    <div className="relative flex flex-col items-center min-h-lvh text-white pt-20 gap-3">
                        <div className="text-3xl xl:text-5xl lg:text-4xl md:text-2xl mt-3 lg:w-[95%] w-full text-primary font-semibold text-center pb-16">
                            Staking Overview
                        </div>
                        <TransactionTable />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionBoard;
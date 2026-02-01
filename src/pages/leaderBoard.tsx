import React, { useEffect } from "react";
import Web3 from "web3";
import Spinner from "../components/Spinner";
import contractABI from '../utils/abis/stakingContract.json';
import { useState } from "react";
import Alert from "../components/Alert";
import { useWalletContext } from "../utils/context/walletContext";
import { useNavigate } from "react-router-dom";

export const shortNumber = (num: number) => {
    let formatted: string;

    if (num >= 1e9) formatted = (num / 1e9).toFixed(2) + "B";
    else if (num >= 1e6) formatted = (num / 1e6).toFixed(2) + "M";
    else if (num >= 1e3) formatted = (num / 1e3).toFixed(2) + "K";
    else formatted = num.toFixed(2);

    // Remove trailing zeros and unnecessary decimal points
    return formatted.replace(/\.?0+([KM])?$/, '$1') + " ";
};

const LeaderboardTable = () => {
    interface Position {
        id: string;
        amount: string;
        startTime: string;
        endTime: string;
        numDays: string;
        withdrawn: boolean;
        reward: string;
    }
    const [err, setErr] = useState({
        isErr: false, errMsg: ''
    });
    const [loading, setLoading] = useState(false);
    const contractAddress = import.meta.env.VITE_STAKE_CA;
    const { data } = useWalletContext();
    const [positions, setPositions] = useState<Position[]>([]);
    const navigate = useNavigate();
    const handleUnstake = async (id: string) => {
        try {
            if (!data.address) {
                setErr({
                    isErr: true,
                    errMsg: `Please connect your wallet first.`,
                });
                return;
            }

            // Ensure window.ethereum is available
            if (typeof window.ethereum === "undefined") {
                setErr({
                    isErr: true,
                    errMsg: `Please install MetaMask or connect an Ethereum wallet.`,
                });
                return;
            }
            const web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];

            const stakingContract = new web3.eth.Contract(contractABI, contractAddress);
                        // Find the position
            const position = positions.find(pos => pos.id === id);
            if (!position) {
                setErr({
                    isErr: true,
                    errMsg: `Position #${id} not found.`,
                });
                return;
            }
            if (position.withdrawn) {
                setErr({
                    isErr: true,
                    errMsg: `Position #${id} has already been withdrawn.`,
                });
                return;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime < Number(position.endTime)) {
                const unlockDate = new Date(Number(position.endTime) * 1000);
                setErr({
                    isErr: true,
                    errMsg: `Lock period has not ended yet. Unlock date: ${unlockDate.toLocaleString()}`,
                });
                return;
            }
                        // Call unstake function with position id
            const unstakeTx = await stakingContract.methods.unstake(id).send({ from: account });
            console.log("Unstake transaction sent:", unstakeTx.transactionHash);
            await fetchPositionData();

            setErr({
                isErr: true,
                errMsg: `Position #${id} unstaked successfully! Transaction: ${unstakeTx.transactionHash}`,
            });

        }catch (error: any){
            console.error("Error during unstaking:", error);
            
            let errorMessage = "An error occurred during unstaking. Please try again.";
            
            // Handle specific error messages from the contract
            if (error.message) {
                if (error.message.includes("Position not found")) {
                    errorMessage = "Position not found in the contract.";
                } else if (error.message.includes("Already withdrawn")) {
                    errorMessage = "This position has already been withdrawn.";
                } else if (error.message.includes("Lock period not ended")) {
                    errorMessage = "Lock period has not ended yet.";
                } else if (error.message.includes("User denied")) {
                    errorMessage = "Transaction was rejected by user.";
                }
            }
            
            setErr({
                isErr: true,
                errMsg: errorMessage,
            });
        }
    }
    const fetchPositionData = async () => {
        try{
            setLoading(true);
            const web3 = new Web3(window.ethereum);
            const stakingContract = new web3.eth.Contract(contractABI, contractAddress);
            const allPositions: any = await stakingContract.methods.getAllPositions(data.address).call();
            const formattedPositions: Position[] = await Promise.all(
                allPositions.map(async (pos: any) => {
                    // Calculate reward for this specific position using position id
                    let reward = "0";
                    try {
                        const rawReward: any = await stakingContract.methods.calculateReward(data.address, pos[0]).call();
                        reward = web3.utils.fromWei(rawReward, 'ether');
                    } catch (error) {
                        console.error(`Error calculating reward for position ${pos[0]}:`, error);
                    }

                    return {
                        id: pos[0].toString(),
                        amount: web3.utils.fromWei(pos[1].toString(), "ether"),
                        startTime: pos[2].toString(),
                        endTime: pos[3].toString(),
                        numDays: pos[4].toString(),
                        withdrawn: pos[5],
                        reward: reward
                    };
                })
            );
            
            setPositions(formattedPositions);
        }catch (error) {
            console.error("Error fetching positions:", error);
        }finally {
            setLoading(false);
        }
        
    }

    useEffect(() => {
        fetchPositionData();
    }, [data]);

    const formatDate = (timestamp: string) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatNumber = (value: string | number) => {
        return parseFloat(value.toString()).toString();
    };

    const handleRowClick = (positionId: string, position: Position) => {
        navigate(`/lock/${positionId}`, { state: { position } });
    };
    if (loading) {
        return <Spinner size="12" color="white" />;
    }
    return (
        <div className="w-full bg-slate-900 rounded-xl shadow-2xl border border-slate-700/50">
            <div className="p-8">
                {positions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        No positions found
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 pb-4 text-sm text-slate-400 font-medium border-b border-slate-700/30">
                            <div className="col-span-2">Lock No.</div>
                            <div className="col-span-1">Remain</div>
                            <div className="col-span-2">Amount</div>
                            <div className="col-span-2">Reward</div>
                            <div className="col-span-3">Unlock Date</div>
                            <div className="col-span-1">Status</div>
                            <div className="col-span-1">Action</div>
                        </div>

                        {/* Table Rows */}
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                            {positions.map((position, index) => (
                                <div 
                                    key={index} 
                                    onClick={() => handleRowClick(position.id, position)}
                                    className="hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
                                >
                                    <div className="grid grid-cols-12 gap-4 px-4 py-4 text-white">
                                        <div className="col-span-2">
                                            <div className="font-semibold">Lock #{position.id}</div>
                                            {!position.withdrawn && (
                                                <button className="text-xs text-emerald-400 hover:text-emerald-300 mt-1">
                                                    Extend Lock Time
                                                </button>
                                            )}
                                        </div>
                                        <div className="col-span-1 flex items-center text-slate-300 text-sm">
                                            {position.numDays} Days
                                        </div>
                                        <div className="col-span-2 flex items-center">
                                            {formatNumber(position.amount)} CRABMAN
                                        </div>
                                        <div className="col-span-2 flex items-center text-emerald-400">
                                            {formatNumber(position.reward)} CRABMAN
                                        </div>
                                        <div className="col-span-3 flex items-center text-slate-300 text-sm">
                                            {formatDate(position.endTime)}
                                        </div>
                                        <div className="col-span-1 flex items-center">
                                            {position.withdrawn ? (
                                                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                                                    Withdrawn
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="col-span-1 flex items-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnstake(position.id);
                                                }}
                                                disabled={position.withdrawn}
                                                className="px-2 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold rounded-md transition-all duration-200 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-red-500/50 active:scale-95"
                                            >
                                                Unstake
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {err.isErr && <Alert data={err.errMsg} onClose={() => setErr({ isErr: false, errMsg: '' })} />}
                    </>
                )}
            </div>
        </div>
        
    );
}

const LeaderBoard: React.FC = () => {
    const title = "My Positions";

    return (
        <div className="bg-[#00e0ff] dark:bg-[#FCA311] rounded-b-[60px] relative z-[10]">
            <div className="w-full 2xl:w-[1280px] 2xl:mx-auto md:px-8 2xl:px-0 px-4 pb-[150px]">
                {/* Hero Section */}
                <div className="relative w-full md:pt-[80px] pt-[30px]">
                    {/* Content */}
                    <div className="relative flex flex-col items-start justify-start min-h-lvh text-white z-10 pt-20 gap-3">
                        {/* <div className="md:text-lg text-lg font-bold border border-white text-white rounded-tr-3xl rounded-bl-3xl w-max px-6 py-1 mt-10 mb:mt-20">Leaderboard</div> */}
                        <div className="text-3xl md:text-5xl mt-5 mb-8 w-full text-[#FCA311] dark:text-[#4DF6DD] font-semibold text-center">{title}</div>
                        <LeaderboardTable />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderBoard;
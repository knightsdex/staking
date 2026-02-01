import React, { useEffect, useState } from "react";
import Web3 from "web3";
import LockDaysSlider from "./StepSlider";
import contractABI from '../utils/abis/stakingContract.json';
import tokenABI from '../utils/abis/token.json';

import { useWalletContext } from "../utils/context/walletContext";

import { ConnectWalletButton } from "../utils/lib/connect-button";
import InfoCard from "./InfoCard";
import Modal from "./Modal";
import PosModal from "./PosModal";
import Alert from "./Alert";
import avatar from "../assets/img/svg-export-3x.png"
// import WMT_video from '../assets/wmt.mp4'


const MIN_DAYS = 1;
const MAX_DAYS = 365;

interface Position {
    id: string;
    amount: string;
    startTime: string;
    endTime: string;
    numDays: string;
    withdrawn: boolean;
    reward: string;
}


const StakingCard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
    const [balance, setBalance] = useState<number | string>("-");
    const [amount, setAmount] = useState<any>("");
    const [stakeAmount, setStakeAmount] = useState<number | string>("-");
    const [days, setDays] = useState<number>(90);
    const [posCount, setposCount] = useState<number | string>("-");
    const [modalStatus, setModalStatus] = useState('closed');
    const [positions, setPositions] = useState<Position[]>([]);
    const [posModalStatus, setPosModalStatus] = useState('closed');
    const [err, setErr] = useState({
        isErr: false, errMsg: ''
    });
    const [isMax, setIsMax] = useState<boolean>(true);
    const { data } = useWalletContext();


    //sepolia network
    const contractAddress = import.meta.env.VITE_STAKE_CA;
    const tokenContractAddress = import.meta.env.VITE_TOKEN_CA;

    const handleInputAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
            setAmount(value);
            setIsMax(false)
            return;
        }
        // Check if the value is a valid number and not a negative or invalid input
        // if (!/^\d*\.?\d*$/.test(value) || Number(value) === 0) {
        //     return; // Reject invalid input
        // }
        if (!/^(0|[1-9]\d*)(\.\d*)?$/.test(value)) {
            return; // Reject invalid input
        }
        setAmount(value);
        setIsMax(false);
    };

    const handleInputChange = (value: number) => {
        if (Number.isNaN(value)) return;

        const clamped = Math.min(
        MAX_DAYS,
        Math.max(MIN_DAYS, value)
        );

        setDays(clamped);
    };

    const handleMax = () => {
        if (isMax || !data.address) {
            setAmount('')
        } else {
            if (activeTab === 'stake') {
                setAmount(balance)
            } else {
                setAmount(stakeAmount)
            }
        }
        setIsMax(!isMax);
    }

    const fetchStakingData = async () => {
        if (!amount) {
            setIsMax(false)
        }
        try {
            if (!data.address) {
                setStakeAmount('-');
                setAmount('');
                setBalance('-');
                setposCount('-');
                setPositions([]);
                return
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

            const stakingContract = new web3.eth.Contract(contractABI, contractAddress);
            const tokenContract = new web3.eth.Contract(tokenABI, tokenContractAddress);

            const tokenBalance: any = await tokenContract.methods.balanceOf(data.address).call();
            // const decimals = await tokenContract.methods.decimals().call();
            const formattedBalance = web3.utils.fromWei(tokenBalance, "ether");
            setBalance(formattedBalance);
            const positionCount: any = await stakingContract.methods.numPositions(data.address).call();
            setposCount(positionCount)
            // Fetch stake data from the contract
            const allPositions: any = await stakingContract.methods.getAllPositions(data.address).call();
            const formattedPositions: Position[] = await Promise.all(
                allPositions.map(async (pos: any) => {
                    // Calculate reward for this specific position using position id
                    let reward = "0";
                    try {
                        const rawReward: any = await stakingContract.methods.calculateReward(data.address, pos[0]).call();
                        reward = web3.utils.fromWei(rawReward, "ether");
                    } catch (error) {
                        console.error(`Error calculating reward for position ${pos[0]}:`, error);
                    }

                    return {
                        id: pos[0].toString(),
                        amount: web3.utils.fromWei(pos[1], "ether"),
                        startTime: pos[2].toString(),
                        endTime: pos[3].toString(),
                        numDays: pos[4].toString(),
                        withdrawn: pos[5],
                        reward: reward
                    };
                })
            );
            
            setPositions(formattedPositions);

        } catch (error) {
            console.error("Error fetching staking data:", error);
        }
    };

    useEffect(() => {
        fetchStakingData();
    }, [data]);

    const handleStakeAction = () => {
        setActiveTab('stake');
        // setAmount(balance);
        setModalStatus('opened');
    }

    const handleShowPosition = () => {
        setPosModalStatus('opened');
    }
    const handleStake = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setErr({
                isErr: true,
                errMsg: `Please enter a valid amount to stake.`,
            });
            return;
        }

        if (Number(amount) > Number(balance)) {
            setErr({
                isErr: true,
                errMsg: `You have insufficient balance to stake !!!`,
            });
            setAmount('')
            setIsMax(false);
            return
        }

        try {
            // Ensure the wallet is connected
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

            setModalStatus('loading');

            // Initialize Web3
            const web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" }); // Request user accounts
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0]; // Get the user's account address

            const stakingContract = new web3.eth.Contract(contractABI, contractAddress);
            const tokenContract = new web3.eth.Contract(tokenABI, tokenContractAddress);
            const stakeAmount = web3.utils.toWei(amount, "ether");

            // Approve the staking contract to spend tokens
            const approvalTx = await tokenContract.methods.approve(contractAddress, stakeAmount).send({ from: account });
            console.log("Approval transaction sent:", approvalTx.transactionHash);

            
            // Call the stake function
            const stakeTx = await stakingContract.methods.stake(stakeAmount, days).send({ from: account });
            // fetchStakingData();
            console.log("Stake transaction sent:", stakeTx.transactionHash);

            setErr({
                isErr: true,
                errMsg: `Tokens staked successfully!`,
            });
            setAmount(''); // Reset the input field
            setIsMax(false)
            fetchStakingData();
        } catch (error) {
            console.error("Error during staking:", error);
            setErr({
                isErr: true,
                errMsg: `An error occurred during staking. Please try again.`,
            });
        } finally {
            handleCloseModal();
        }
    };

    const handleUnstake = async (id: string) => {
        try {
            // Ensure the wallet is connected
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

            setPosModalStatus('loading');

            // Initialize Web3
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

            // Check if already withdrawn
            if (position.withdrawn) {
                setErr({
                    isErr: true,
                    errMsg: `Position #${id} has already been withdrawn.`,
                });
                return;
            }

            // Check if lock period has ended
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

            // Refresh staking data
            await fetchStakingData();

            setErr({
                isErr: true,
                errMsg: `Position #${id} unstaked successfully! Transaction: ${unstakeTx.transactionHash}`,
            });

            // Close the positions modal
            setPosModalStatus('closed');

        } catch (error: any) {
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
        } finally {
            setPosModalStatus('closed');
        }
    };

    const handleCloseModal = () => {
        setModalStatus('closed');
        setAmount('')
    }

    const handleClosePosModal = () => {
        setPosModalStatus('closed');
    }

    return (
        <>
            <div className="w-full bg-[#4DF6DD] relative z-[10]">
                <div className="w-full 2xl:w-[1280px] 2xl:mx-auto md:px-8 2xl:px-0 px-4 text-primary pt-20 pb-12 gap-20">
                    <div className="w-full md:pt-[80px] pt-[30px] bg-[#4DF6DD]">
                        <div className="space-y-4">
                            <div className="rounded-3xl bg-[#004450] border border-[#D4D4D4] dark:bg-[#FCA311] dark:border-[#202020] mx-auto flex flex-col gap-6 md:px-6 md:py-8 p-6 w-full mb-5 relative">
                                <div className="text-[#FAFAFA] dark:text-[#004450] font-[400] font-semibold">
                                    Understanding EVM Staking Epochs
                                </div>
                                <div className="flex flex-col md:flex-row gap-6 text-sm text-[#A3A3A3] relative">
                                    <div className="flex-1 md:w-1/2">
                                        <p className="text-[#FAFAFA] dark:text-[#004450] font-[400] font-semibold">Staking rewards are calculated in 1 day epoch.<br></br>Here's how it works:</p>
                                        <ul className="list-disc dark:text-[#004450] pl-6 font-semibold text-[#FAFAFA]">
                                            <li>Your first epoch begins on the time you stake</li>
                                            <li>Each epoch runs for exactly 1 day</li>
                                            <li>You only earn rewards for complete epochs</li>
                                            <li>APY(Annual Percentage Yield) : 70%</li>
                                        </ul>
                                    </div>
                                    <div className="absolute left-[39%] top-1/2 -translate-x-1/2 -translate-y-1/2 md:block hidden z-0">
                                        <img 
                                            src={avatar} 
                                            alt="Avatar" 
                                            className="w-[100px] h-[100px] object-contain" 
                                        />
                                    </div>
                                    <div className="flex flex-col md:w-1/2 gap-2 font-semibold text-[#FAFAFA] relative z-10">
                                        <div className="flex flex-col">
                                            <p className="dark:text-[#004450] font-[400] font-semibold text-[#FAFAFA]">Example:</p>
                                            <p className="dark:text-[#004450]">If you stake 1,000 BULLZILLA tokens for 30 days on June 10th at 2:00 PM, here's what happens:<br></br>Stake Date: June 10th, 2:00 PM<br></br>Lock Period Ends: July 10th, 2:00 PM (exactly 30 days later)<br></br>Your Reward: 57 BULLZILLA tokens (1,000 × 30 days × 0.19% = 57 BULLZILLA)<br></br>Total When Unstaking: 1,057 BULLZILLA tokens</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <InfoCard disabled={!data?.address} label='position' value={posCount} viewDetail={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_STAKE_CA}#tokentxns`} stakeAction={handleStakeAction} showPositions = {handleShowPosition} staked={stakeAmount !== '-' && Number(stakeAmount) !== 0} />
                            <InfoCard disabled={!data?.address} label='stake' value={balance} viewDetail={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_STAKE_CA}#tokentxns`} stakeAction={handleStakeAction} staked={stakeAmount !== '-' && Number(stakeAmount) !== 0} />
                            
                            {/* <div className="flex lg:hidden lg:flex-row flex-col gap-6">
                                <div className="flex md:flex-row flex-col gap-6">
                                    <InfoCard disabled={!data?.address} label='stake' value={stakeAmount} viewDetail={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_STAKE_CA}#tokentxns`} stakeAction={handleStakeAction} unstakeAction={handleUnstakeAction} staked={stakeAmount !== '-' && Number(stakeAmount) !== 0} />
                                    <InfoCard disabled={!data?.address} label='duration' value={stakingDuration} viewDetail={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_STAKE_CA}#tokentxns`} />
                                </div>
                                <InfoCard disabled={!data?.address} label='balance' value={balance} viewDetail={`https://sepolia.etherscan.io/address/${data?.address}`} stakeAction={handleStakeAction} unstakeAction={handleUnstakeAction} staked={stakeAmount !== '-' && Number(stakeAmount) !== 0} />
                            </div>
                            <div className="hidden lg:flex lg:flex-row gap-6">
                                <InfoCard disabled={!data?.address} label='stake' value={stakeAmount} viewDetail={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_STAKE_CA}#tokentxns`} stakeAction={handleStakeAction} unstakeAction={handleUnstakeAction} staked={stakeAmount !== '-' && Number(stakeAmount) !== 0} />
                                <InfoCard disabled={!data?.address} label='duration' value={stakingDuration} viewDetail={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_STAKE_CA}#tokentxns`} />
                                <InfoCard disabled={!data?.address} label='balance' value={balance} viewDetail={`https://sepolia.etherscan.io/address/${data?.address}`} stakeAction={handleStakeAction} unstakeAction={handleUnstakeAction} staked={stakeAmount !== '-' && Number(stakeAmount) !== 0} />
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
            <Modal isOpen={modalStatus} onClose={handleCloseModal}>
                <h2 className="text-xl font-semibold text-primary">{activeTab === 'stake' ? 'Stake BULLZILLA' : 'Unstake BULLZILLA'}</h2>
                <InfoCard label={activeTab === 'stake' ? 'canstake' : 'canunstake'} value={activeTab === 'stake' ? balance : stakeAmount} />
                <div className="flex flex-col w-full gap-1">
                    <div className="text-primary">Amount to {activeTab === 'stake' ? 'stake' : 'unstake'}</div>
                    <div className="flex flex-row items-center justify-between border border-[#5b5b5b] rounded-lg pr-4 bg-card-bg">
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => handleInputAmount(e)}
                            className="w-full font-semibold placeholder:text-[#5b5b5b] border-none bg-inherit focus:ring-0 outline-none rounded-lg text-primary"
                            inputMode="decimal" // Suggests a numeric keyboard on mobile devices
                            pattern="\d*\.?\d*"
                        />
                        <div className="flex flex-row gap-2 items-center">
                            <div className="text-primary">BULLZILLA</div>
                            <button disabled={(activeTab === 'stake' && (balance === '0' || balance === '-')) || (activeTab === 'unstake' && (stakeAmount === '0' || stakeAmount === '-'))} onClick={handleMax} className="text-black px-3 py-[1px] bg-[#fff533] rounded-2xl cursor-pointer disabled:cursor-not-allowed disabled:bg-[#5b5b5b] text-sm">
                                {
                                    isMax ? 'Clear' : 'Max'
                                }
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-row items-center justify-between border border-[#5b5b5b] rounded-lg pr-4 bg-card-bg">
                        <input
                            type="number"
                            min={MIN_DAYS}
                            max={MAX_DAYS}
                            value={days}
                            onChange={(e) => handleInputChange(Number(e.target.value))}
                            className="w-full font-semibold placeholder:text-[#5b5b5b] border-none bg-inherit focus:ring-0 outline-none rounded-lg text-primary"
                        />
                        <div className="flex flex-row gap-2 items-center">
                            <div className="text-primary">Days</div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col w-full gap-1">
                    <LockDaysSlider
                        days={days}
                        onChange={handleInputChange}
                    />
                </div>
                {
                    data.address ?
                        <button className={`rounded-3xl py-2 px-4 text-[16px] bg-[#fff533] text-black hover:text-[#5b5b5b] font-bold flex flex-row items-center justify-center gap-1 w-max`} onClick={handleStake}>
                            <div>
                                {activeTab === 'stake' ? 'Stake BULLZILLA' : 'Unstake BULLZILLA'}
                            </div>
                        </button> :
                        <div className="flex items-center justify-center w-full">
                            <ConnectWalletButton className="bg-black hover:bg-[#fff533] hover:text-black hover:border-yellow-300 text-white px-4 py-2 rounded-full border border-[#525252] font-semibold flex flex-row gap-1" />
                        </div>
                }
            </Modal>
            <PosModal 
                isOpen={posModalStatus} 
                onClose={handleClosePosModal} 
                positions={positions}
                handleUnstake={handleUnstake}
            />
            {err.isErr && <Alert data={err.errMsg} onClose={() => setErr({ isErr: false, errMsg: '' })} />}
        </>

    );
};

export default StakingCard;

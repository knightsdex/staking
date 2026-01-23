import React, { useEffect, useState } from "react";
import Web3 from "web3";

import contractABI from '../utils/abis/stakingContract.json';
import tokenABI from '../utils/abis/token.json';

import { useWalletContext } from "../utils/context/walletContext";

import { ConnectWalletButton } from "../utils/lib/connect-button";
import InfoCard from "./InfoCard";
import Modal from "./Modal";
import Alert from "./Alert";
import { shortNumber } from "../pages/leaderBoard";
// import WMT_video from '../assets/wmt.mp4'


const StakingCard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
    const [balance, setBalance] = useState<number | string>("-");
    const [amount, setAmount] = useState<any>("");
    const [stakeAmount, setStakeAmount] = useState<number | string>("-");
    const [reward, setReward] = useState<number | string>("-");
    const [stakingDuration, setStakingDuration] = useState<number | string>("-");
    // const [lockMonths, setLockMonths] = useState<number>(1);
    const [modalStatus, setModalStatus] = useState('closed');
    const [err, setErr] = useState({
        isErr: false, errMsg: ''
    });
    const [isMax, setIsMax] = useState<boolean>(true);
    // const [isLocked, setIsLocked] = useState<boolean>(true);
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
                setReward('-');
                setStakingDuration('-');
                setAmount('');
                setBalance('-')
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
            const formattedBalance = web3.utils.fromWei(tokenBalance, "ether"); // Convert from Wei to Ether for readability
            setBalance(formattedBalance);

            // Fetch stake data from the contract
            const stakeData: any = await stakingContract.methods.stakes(data.address).call();
            const currentTime = Date.now();
            const startTime: number = Number(web3.utils.fromWei(stakeData.startTime, 0));
            if (startTime === 0) {
                setStakingDuration(0)
            } else {
                const currentTimeInSeconds = Math.floor(currentTime / 1000);
                const duration = Math.floor((currentTimeInSeconds - startTime) / 3600 / 24);
                if (duration <= 0) {
                    setStakingDuration(0)
                } else {
                    setStakingDuration(duration); // Replace with your logic for duration
                }
            }
            setStakeAmount(web3.utils.fromWei(stakeData.amount, "ether"));
            const rawReward: any = await stakingContract.methods.calculateReward(data.address).call();
            const finalReward = Number(web3.utils.fromWei(rawReward, 'ether'));
            setReward(finalReward);

            // if (modalStatus === true) {
            //     setAmount(formattedBalance);
            // } else {
            //     setAmount(web3.utils.fromWei(stakeData.amount, "ether"))
            // }

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

    const handleUnstakeAction = () => {
        setActiveTab('unstake');
        // setAmount(stakeAmount);
        setModalStatus('opened');
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
            const stakeTx = await stakingContract.methods.stake(stakeAmount).send({ from: account });
            fetchStakingData();
            console.log("Stake transaction sent:", stakeTx.transactionHash);

            setErr({
                isErr: true,
                errMsg: `Tokens staked successfully!`,
            });
            setAmount(''); // Reset the input field
            setIsMax(false)
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

    const handleUnstake = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setErr({
                isErr: true,
                errMsg: `Please enter a valid amount to unstake.`,
            });
            return;
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

            // Check user's stake data (amount staked and rewards)
            const stakeData: any = await stakingContract.methods.stakes(account).call();
            const stakedAmount = stakeData.amount;
            const stakedAmountDecimal = web3.utils.fromWei(stakedAmount, "ether");

            if (Number(stakedAmountDecimal) === 0) {
                setErr({
                    isErr: true,
                    errMsg: `You don't have any tokens staked to withdraw.`,
                });
                setAmount('')
                setIsMax(false);
                return;
            }

            if (Number(amount) > Number(stakedAmountDecimal)) {
                setErr({
                    isErr: true,
                    errMsg: `You have insufficient stake to withdraw !!!`,
                });
                setAmount('')
                setIsMax(false);
                return;
            }

            if (Number(stakedAmountDecimal) === Number(amount)) {
                // unstake call from the staking contract
                const unstakeTx = await stakingContract.methods.unstake().send({ from: account });
                console.log("Unstake transaction sent:", unstakeTx.transactionHash);
            } else {
                // partialUnstake call from the staking contract
                const stakeAmount = web3.utils.toWei(amount, "ether");
                const unstakeTx = await stakingContract.methods.partialUnstake(stakeAmount).send({ from: account });
                console.log("Unstake transaction sent:", unstakeTx.transactionHash);
            }
            fetchStakingData();
            setErr({
                isErr: true,
                errMsg: `Tokens unstaked successfully!`,
            });
            setAmount('')
            setIsMax(false)
        } catch (error) {
            console.error("Error during unstaking:", error);
            setErr({
                isErr: true,
                errMsg: `An error occurred during unstaking. Please try again.`,
            });
        } finally {
            handleCloseModal();
        }
    };

    const handleCloseModal = () => {
        setModalStatus('closed');
        setAmount('')
    }

    return (
        <>
            <div className="w-full bg-primary-bg relative z-[10]">
                <div className="w-full 2xl:w-[1280px] 2xl:mx-auto md:px-8 2xl:px-0 px-4 text-primary pt-20 gap-20">
                    <div className="w-full md:pt-[80px] pt-[30px] bg-primary-bg">
                        <div className="space-y-6">
                            <div className="rounded-3xl bg-[#FAFAFA] border border-[#D4D4D4] dark:bg-[#121212] dark:border-[#202020] mx-auto flex flex-col gap-6 md:px-6 md:py-8 p-6 w-full">
                                <div className="text-black dark:text-white font-[400] font-semibold text-light">
                                    Understanding EVM Staking Epochs
                                </div>
                                <div className="flex flex-col md:flex-row gap-6 text-sm text-[#A3A3A3]">
                                    <div className="flex-1 md:w-1/2">
                                        <p className="text-black dark:text-white font-[400] font-semibold text-light">Staking rewards are calculated in 1 month epoch. Here's how it works:</p>
                                        <ul className="list-disc pl-6 font-semibold text-light">
                                            <li>Your first epoch begins on the 1st of the month you stake</li>
                                            <li>Each epoch runs for exactly 1 month</li>
                                            <li>You only earn rewards for complete epochs</li>
                                            <li>Rewards are distributed at the end of month</li>
                                        </ul>
                                    </div>
                                    <div className="flex flex-col md:w-1/2 gap-2 font-semibold text-light">
                                        <div className="flex flex-col">
                                            <p className="text-black dark:text-white font-[400] font-semibold text-light">Example:</p>
                                            <p>If you stake on June 10th, your first epoch will start on June 1st and end at the first day of the next month. Your first rewards will be available on July 1st. Your second epoch will then run until August 1st.</p>
                                        </div>
                                        <div>
                                            <span className="text-black dark:text-white font-[400] font-semibold text-light">Note: </span>
                                            <span>Your personal epoch schedule is based on when you first stake, so your reward dates may differ from other users.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <InfoCard disabled={!data?.address} label='reward' value={reward} viewDetail={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_STAKE_CA}#tokentxns`} stakeAction={handleStakeAction} unstakeAction={handleUnstakeAction} staked={stakeAmount !== '-' && Number(stakeAmount) !== 0} />
                            <div className="flex lg:hidden lg:flex-row flex-col gap-6">
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal isOpen={modalStatus} onClose={handleCloseModal}>
                <h2 className="text-xl font-semibold text-primary">{activeTab === 'stake' ? 'Stake WMTx' : 'Unstake WMTx'}</h2>
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
                            <div className="text-primary">WMTx</div>
                            <button disabled={(activeTab === 'stake' && (balance === '0' || balance === '-')) || (activeTab === 'unstake' && (stakeAmount === '0' || stakeAmount === '-'))} onClick={handleMax} className="text-black px-3 py-[1px] bg-[#fff533] rounded-2xl cursor-pointer disabled:cursor-not-allowed disabled:bg-[#5b5b5b] text-sm">
                                {
                                    isMax ? 'Clear' : 'Max'
                                }
                            </button>
                        </div>
                    </div>
                </div>
                {/* <div className="flex flex-col w-full gap-1">
                    <div className="text-primary">Lock Duration</div>
                    <div className="flex flex-row items-center justify-between border border-[#5b5b5b] rounded-lg pr-4 bg-card-bg">
                        <select
                            value={lockMonths}
                            onChange={(e) => setLockMonths(Number(e.target.value))}
                            className="w-full h-11 px-3 pr-8 font-semibold border-none bg-inherit focus:ring-0 outline-none text-primary appearance-none"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <option key={month} value={month}>
                                    {month}
                                </option>
                            ))}
                        </select>
                        <div className="flex flex-row gap-2 items-center">
                            <div className="text-primary">Months</div>
                            <button className="text-black px-3 py-[1px] bg-[#fff533] rounded-2xl cursor-pointer disabled:cursor-not-allowed disabled:bg-[#5b5b5b] text-sm">
                                {
                                    isMax ? 'Lock' : 'Locked'
                                }
                            </button>
                        </div>
                    </div>
                </div> */}
                <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col gap-4 rounded-xl">
                        <div className="flex flex-row justify-between text-sm">
                            <div className="flex flex-row gap-2 items-center text-[#A3A3A3]">
                                Total Staked
                            </div>
                            <p className="text-primary">{shortNumber(Number(stakeAmount))} WMTx</p>
                        </div>

                        <div className="flex flex-row justify-between text-sm">
                            <div className="flex flex-row gap-2 items-center text-[#A3A3A3]">
                                <p>My Reward</p>
                            </div>
                            <p className="text-primary">{shortNumber(Number(reward))} WMTx</p>
                        </div>

                        <div className="flex flex-row justify-between text-sm">
                            <div className="flex flex-row gap-2 items-center text-[#A3A3A3]">
                                <p>Staking Duration</p>
                            </div>
                            <p className="text-primary">{stakingDuration} Days</p>
                        </div>
                    </div>
                </div>
                {
                    data.address ?
                        <button className={`rounded-3xl py-2 px-4 text-[16px] bg-[#fff533] text-black hover:text-[#5b5b5b] font-bold flex flex-row items-center justify-center gap-1 w-max`} onClick={activeTab === 'stake' ? handleStake : handleUnstake}>
                            <div>
                                {activeTab === 'stake' ? 'Stake WMTx' : 'Unstake WMTx'}
                            </div>
                        </button> :
                        <div className="flex items-center justify-center w-full">
                            <ConnectWalletButton className="bg-black hover:bg-[#fff533] hover:text-black hover:border-yellow-300 text-white px-4 py-2 rounded-full border border-[#525252] font-semibold flex flex-row gap-1" />
                        </div>
                }
            </Modal>
            {err.isErr && <Alert data={err.errMsg} onClose={() => setErr({ isErr: false, errMsg: '' })} />}
        </>

    );
};

export default StakingCard;

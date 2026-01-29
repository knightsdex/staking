import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import LockDaysSlider from "../components/StepSlider";
import contractABI from '../utils/abis/stakingContract.json';
import Web3 from "web3";

interface Position {
    id: string;
    amount: string;
    startTime: string;
    endTime: string;
    numDays: string;
    withdrawn: boolean;
    reward: string;
}

const MIN_DAYS = 1;
const MAX_DAYS = 365;

const LockDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [autoMaxLock, setAutoMaxLock] = useState<boolean>(false);
    const [days, setDays] = useState<number>(90);
    const [selectedTimeOption, setSelectedTimeOption] = useState<string>('');
    const position = location.state?.position as Position | undefined;
    const contractAddress = import.meta.env.VITE_STAKE_CA;

    const timeOptions = [
        { label: '1W', days: 7 },
        { label: '4W', days: 28 },
        { label: '12W', days: 84 },
        { label: '26W', days: 182 },
        { label: 'MAX', days: 365 },
    ];

    // Handle Auto Max-lock toggle effect
    useEffect(() => {
        if (autoMaxLock) {
            setDays(MAX_DAYS);
            setSelectedTimeOption('MAX');
        }
    }, [autoMaxLock]);

    const handleInputChange = (value: number) => {
        if (Number.isNaN(value)) return;
        const clamped = Math.min(MAX_DAYS, Math.max(MIN_DAYS, value));
        setDays(clamped);
        
        // Update selected option if it matches
        const matchingOption = timeOptions.find(opt => opt.days === clamped);
        if (matchingOption) {
            setSelectedTimeOption(matchingOption.label);
        } else {
            setSelectedTimeOption('');
        }
        
        // Turn off auto max lock if days is changed manually and not at max
        if (clamped !== MAX_DAYS && autoMaxLock) {
            setAutoMaxLock(false);
        }
    };

    const handleTimeOptionClick = (option: { label: string; days: number }) => {
        if (option.days > 0) {
            setDays(option.days);
            setSelectedTimeOption(option.label);
        }
    };

    const handleAutoMaxLockToggle = (checked: boolean) => {
        setAutoMaxLock(checked);
        if (!checked && days === MAX_DAYS) {
            // Optionally reset to a lower value when turning off
            // setDays(182);
            // setSelectedTimeOption('26W');
        }
    };

    const handleExtendLock = async() => {
        const web3 = new Web3(window.ethereum);
        const stakingContract = new web3.eth.Contract(contractABI, contractAddress);
        const accounts = await web3.eth.getAccounts();
        const account = accounts[0];
        const extendtx = await stakingContract.methods.extend(id, days).send({ from: account });
        console.log("Extend transaction sent:", extendtx.transactionHash);
    }
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

    const isMaximized = days >= MAX_DAYS;

    return (
        <div className="bg-[#4DF6DD] dark:bg-[#FCA311] min-h-screen">
            <div className="max-w-2xl mx-auto px-4 py-8 pt-[140px] ">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="text-[#FCA311] dark:text-[#004450] text-xl hover:opacity-70 transition-opacity"
                    >
                        ← 
                    </button>
                    <h1 className="text-2xl font-bold text-[#FCA311] dark:text-[#004450]">
                        Lock #{id}
                    </h1>
                </div>

                {/* Description */}
                <p className="text-[#FCA311] dark:text-[#004450] font-bold text-sm mb-8">
                    Increase your token balance by increasing the lock
                    time of your locked $BZIL
                </p>

                {/* Main Content Container */}
                <div className="bg-[#162238] rounded-2xl p-6 space-y-6">
                    
                    {/* Additional Lock Time Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-white font-semibold">
                                Additional Lock Time
                            </h2>
                            <span className="text-gray-400 text-sm">
                                Unlock on {position?.endTime ? formatDate((Number(position.endTime) + (days * 24 * 60 * 60)).toString()) : 'N/A'}
                            </span>
                        </div>
                        
                        {/* Time Option Buttons */}
                        <div className="flex gap-2 mb-4">
                            {timeOptions.map((option) => (
                                <button
                                    key={option.label}
                                    onClick={() => handleTimeOptionClick(option)}
                                    disabled={autoMaxLock && option.label !== 'MAX'}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        selectedTimeOption === option.label
                                            ? 'bg-teal-500 text-white'
                                            : 'bg-[#1a2942] text-gray-400 hover:bg-[#1f3350]'
                                    } ${autoMaxLock && option.label !== 'MAX' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Slider */}
                        <LockDaysSlider
                            days={days}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Auto Max-lock Mode Section */}
                    <div className="border-t border-gray-700 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-white font-semibold">
                                Auto Max-lock Mode
                            </h2>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoMaxLock}
                                    onChange={(e) => handleAutoMaxLockToggle(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                            </label>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3">
                            When enabled, the lock is set to the maximum duration of 1
                            years, and will remain active indefinitely beyond that
                            period unless changed. If disabled, the lock will expire 1
                            years from the date it was turned off.
                        </p>
                        
                        <p className="text-gray-400 text-sm">
                            At maximum lock duration, you receive full (1:1) reward token based on the amount of tokens locked.
                        </p>
                    </div>

                    {/* Lock Stats */}
                    <div className="border-t border-gray-700 pt-6 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Current Maturity Date</span>
                            <span className="text-gray-400 text-sm">
                                {position?.endTime ? formatDate(position.endTime) : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300 font-medium">New Maturity Date</span>
                            <span className="text-teal-400 font-medium">{position?.endTime ? formatDate((Number(position.endTime) + (days * 24 * 60 * 60)).toString()) : 'N/A'}</span>
                        </div>
                    </div>


                    {/* Warning Message */}
                    {isMaximized && (
                        <div className="text-center">
                            <p className="text-red-400 text-sm">
                                The lock time is already maximized.
                            </p>
                        </div>
                    )}

                    {/* Lock Button */}
                    <button
                        onClick={handleExtendLock}
                        className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition-all"
                    >
                        Lock $BZIL
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LockDetail;
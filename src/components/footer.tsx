import React, { useState } from 'react';
import axios from 'axios';
import { SendHorizonalIcon } from 'lucide-react';

import X_icon from '../assets/img/x-icon.png'

import Telegram_icon from '../assets/img/telegram-icon.png'

const Footer: React.FC = () => {

    const [isAccepted, setIsAccepted] = useState(false);
    const [email, setEmail] = useState('')
    const [errMsg, setErrMsg] = useState('')


    const handleInputAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
    };

    function isValidEmail(email: string) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    const handleSubmit = async () => {
        if (email === '' || !isValidEmail(email)) {
            setErrMsg('Please enter a valid email address')
            return
        }
        if (!isAccepted) {
            setErrMsg('Please tick the box to accept our conditions');
            return
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('token', import.meta.env.VITE_AUTH_TOKEN);

        try {
            const response = await axios.post(import.meta.env.VITE_API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.status === 200) {
                setEmail('')
                setIsAccepted(false)
                setErrMsg('Check your email to confirm subscription');
            }
        } catch (error) {
            console.error('Error subscription Email:', error);
        }
    }

    return (
        <div className='bg-black text-white z-[0] scrollbar-hide'>
            <div className='w-full 2xl:w-[1280px] 2xl:mx-auto md:px-8 2xl:px-0 px-4'>
                <div className='md:py-[80px] py-[30px] flex lg:flex-row flex-col lg:gap-[8vw] gap-8 w-full'>
                    <div className='flex flex-col justify-between lg:w-[50%] w-full space-y-12'>
                        <div className='space-y-4'>
                            <div className='text-[18px]'>Stay Ahead. Stay Connected.</div>
                            <div className='text-[#A3A3A3]'>Be the first to hear about exclusive offers and the latest updates from World Mobile.</div>
                            <div className='flex flex-row items-center justify-between border border-[#525252] rounded-md max-w-[380px]'>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => handleInputAmount(e)}
                                    placeholder="Enter your email here"
                                    className="w-full placeholder:text-[#737373] border-none bg-inherit focus:ring-0 outline-none px-3 py-3 rounded-md"
                                />
                                <div
                                    onClick={handleSubmit}
                                    className='bg-[#171717] border-l border-l-[#525252] flex items-center justify-center p-3 rounded-r-md cursor-pointer'
                                >
                                    <SendHorizonalIcon />
                                </div>
                            </div>
                            {errMsg &&
                                <div className={`text-sm ${errMsg === 'Check your email to confirm subscription' ? 'text-[#4BB543]' : 'text-white'}`}>{errMsg}</div>
                            }
                        </div>
                    </div>
                    <div className='flex flex-col justify-between lg:w-[50%] w-full space-y-12'>
                        <div className='space-y-6'>
                            <div className='text-[18px] font-semibold'>Follow us</div>
                            <div className='flex flex-row md:gap-6 justify-between md:justify-start'>
                                <a href="https://x.com/BullzillaERC/" target="_blank" rel="noopener noreferrer">
                                    <img src={X_icon} alt='social-icon' />
                                </a>
                                <a href="https://t.me/BullzillaERC" target="_blank" rel="noopener noreferrer">
                                    <img src={Telegram_icon} alt='social-icon' />
                                </a>
                            </div>
                            <div className='text-[#A3A3A3]'>© 2026 World Mobile All rights reserved.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;

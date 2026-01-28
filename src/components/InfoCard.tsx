import { InfoIcon, SquareArrowOutUpRight } from "lucide-react";
import Popover from "./Popover";
import { shortNumber } from "../pages/leaderBoard";
import { ConnectWalletButton } from "../utils/lib/connect-button";
import { useWalletContext } from "../utils/context/walletContext";

const InfoCard = ({ disabled, label, value, stakeAction, viewDetail, balance, showPositions }: any) => {

    const { data } = useWalletContext();

    const getTitle = () => {
        switch (label) {
            case "position":
                return "Total positions";
            case "stake":
                return "Your balance";
            case "canstake":
                return "Available to stake";
            case "canunstake":
                return "Available to unstake";
            default:
                return "Total positions";
        }
    }

    const getHint = () => {
        switch (label) {
            case "position":
                return "Your positions of WMTx tokens based in your total staked amount and staking duration.";
            case "stake":
                return "Total balance of your wallet";
            case "canstake":
                return "Your available amount of WMTx to stake. It is just your wallet balance of WMTx";
            case "canunstake":
                return "Your available amount of WMTx to unstake. It is just amount of your staked WMTx tokens";
            default:
                return "Coming soon !";
        }
    }

    const handleViewDetails = () => {
        window.open(viewDetail, "_blank", "noopener,noreferrer");
    }

    return (
        <div className={`rounded-3xl ${label === 'position' ? 'bg-[#fff533]' : 'bg-[#4a4943]'} mx-auto flex flex-col gap-6 md:px-6 md:py-8 p-6 w-full`}>
            <div className="flex flex-row justify-between items-center">
                <div className={`${label === 'position' ? 'text-black' : 'text-primary'} font-[400]`}>{getTitle()}</div>
                <Popover
                    toggleChildren={<InfoIcon className={`${label === 'position' ? 'text-black' : 'text-primary'}`} />}
                    position="right-full"
                >
                    <div>{getHint()}</div>
                </Popover>

            </div>
            <div>
                <div className={`font-bold ${label === 'position' ? 'text-black text-5xl' : 'text-primary text-4xl'}`}>{(label === 'position' && (!data.address || !balance)) ? 'Stake WMTx' : shortNumber(Number(value === '-' ? 0 : value)) + 'WMTx'}</div>
                <div className={`text-sm font-semibold ${label === 'position' ? 'text-black' : 'text-light'}`}>{label === 'stake' || label == 'canstake' ? '' : shortNumber((Number(value === '-' ? 0 : value))) + ' Positions'}</div>
            </div>
            <div className="flex md:flex-row flex-col gap-4">
                {
                    (label === 'position' && !data.address) &&
                    <ConnectWalletButton className={`bg-black hover:bg-[#fff533] hover:text-black hover:border-yellow-300 text-white rounded-full border border-[#525252] font-semibold flex flex-row gap-1 px-6 py-3`} />
                }
                {
                    (label === 'position' && data.address) &&
                    <button onClick={showPositions} className={`text-white bg-black hover:text-[#5b5b5b] rounded-full cursor-pointer w-max px-6 py-3`}>Show Positions</button>
                }
                {
                    (label === "stake" && data.address) &&
                    <button onClick={stakeAction} className={`bg-[#FFF533] hover:text-[#5b5b5b] text-black rounded-full cursor-pointer w-max px-4 py-2`}>Stake</button>
                }
                {
                    !(label == "canstake" || label == "canunstake" || label == "position") &&
                    <button disabled={disabled} onClick={handleViewDetails} className={`${label === 'position' ? 'text-black px-6 py-3' : 'text-primary px-4 py-2'} hover:text-[#5b5b5b] rounded-full border border-[#525252] ${disabled ? 'cursor-not-allowed text-[#525252]' : 'cursor-pointer'} flex flex-row justify-center items-center gap-2 w-max`}>
                        <div>View Details</div>
                        <SquareArrowOutUpRight className="font-bold" />
                    </button>
                }
            </div>
        </div>
    )
}

export default InfoCard;
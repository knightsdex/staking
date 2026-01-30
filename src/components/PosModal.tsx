import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Position {
    id: string;
    amount: string;
    startTime: string;
    endTime: string;
    numDays: string;
    withdrawn: boolean;
    reward: string;
}

interface PosModalProps {
    isOpen: string;
    onClose: () => void;
    positions: Position[];
    handleUnstake: (id: string) => void;
}

const PosModal: React.FC<PosModalProps> = ({ isOpen, onClose, positions, handleUnstake}) => {
    const navigate = useNavigate();
    useLayoutEffect(() => {
        if (isOpen === 'opened') {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (isOpen !== 'opened') return null;

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

    const handleRowClick = (positionId: string , position: Position) => {
        navigate(`/lock/${positionId}`,{ state: { position } });
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl mx-4 border border-slate-700/50"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-700/50">
                    <h2 className="text-2xl font-bold text-white">Your Positions</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                        aria-label="Close modal"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
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
                                                            e.stopPropagation(); // Prevent event bubbling to parent row
                                                            handleUnstake(position.id);
                                                        }}
                                                        disabled={position.withdrawn}
                                                        className="w-full px-2 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold rounded-md transition-all duration-200 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-red-500/50 active:scale-95"
                                                    >
                                                        Unstake
                                                    </button>
                                                </div>
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

export default PosModal;